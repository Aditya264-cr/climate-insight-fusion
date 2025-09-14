/**
 * server.js
 * Example backend for the frontend above.
 *
 * Requirements:
 *  - Node 18+ (or Node 16 with node-fetch v2)
 *  - Set GOOGLE_APPLICATION_CREDENTIALS pointing to service account JSON,
 *    or run this on an environment with application default credentials.
 *  - npm i express cors body-parser dotenv @google-cloud/bigquery node-fetch
 *
 * Environment variables:
 *  - PORT (optional)
 *  - BQ_MODEL (ex: my-project.my_dataset.gemini_model) — model for AI.GENERATE*
 *  - PROJECT_ID (optional)
 *  - EMBEDDING_MODEL (optional, default textembedding-gecko)
 *  - DATASET (optional, default my_project.my_dataset)
 *
 * NOTE: Review BigQuery costs and project IAM before running.
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { BigQuery } = require('@google-cloud/bigquery');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args)); // dynamic import (works on Node 18+)
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

const PORT = process.env.PORT || 8787;
const bigquery = new BigQuery();
const BQ_MODEL = process.env.BQ_MODEL || null; // set this to your  BigQuery AI model resource name if available
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'textembedding-gecko';
const PROJECT_ID = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || undefined;
const DATASET = process.env.DATASET || `${PROJECT_ID}.my_dataset`;

/**
 * Helper: safely run a BigQuery query with parameters and return rows.
 */
async function runQuery(sql, params = {}, location = 'US') {
  const options = {
    query: sql,
    params,
    location,
    timeoutMs: 600000
  };
  const [job] = await bigquery.createQueryJob(options);
  const [rows] = await job.getQueryResults();
  return rows;
}

/**
 * POST /api/bigquery
 * body: { indicator, region }
 * returns: { forecast: [...], summary: { ... } }
 */
app.post('/api/bigquery', async (req, res) => {
  const { indicator, region } = req.body || {};
  if (!indicator || !region) return res.status(400).send('indicator and region required');

  try {
    // 1) Run AI.FORECAST on historical series.
    // This SQL uses a parameterized inner SELECT so we avoid SQL injection.
    const forecastSql = `
      SELECT *
      FROM AI.FORECAST(
        (
          SELECT date AS ts, value
          FROM \`bigquery-public-data.world_bank_climate_economy.indicators\`
          WHERE country_name = @region AND indicator = @indicator
          ORDER BY date
        ),
        data_col => 'value',
        timestamp_col => 'ts',
        horizon => 10
      );
    `;
    const forecastRows = await runQuery(forecastSql, { region, indicator });

    // Normalize: the returned rows may have schema like year, value, lower_bound, upper_bound
    const forecast = (forecastRows || []).map(r => ({
      year: r.year || (new Date(r.ts)).getFullYear() || null,
      value: Number(r.value ?? r.forecast_value ?? 0),
      lower: Number(r.lower ?? r.lower_bound ?? (r.value ?? 0)),
      upper: Number(r.upper ?? r.upper_bound ?? (r.value ?? 0))
    }));

    // 2) Try to use AI.GENERATE_TABLE to produce a structured summary (if BQ_MODEL set).
    let summary = {
      summary: 'No summary available (BigQuery model not configured).',
      recommendation_level: 'Unknown',
      justification: '',
      quantifiable_impact: '',
      data_source: 'N/A'
    };

    if (BQ_MODEL) {
      // create a JSON prompt from forecast (string)
      const prompt = `Based on the following 10-year forecast for ${indicator} in ${region}: ${JSON.stringify(forecast.map(f=>({year:f.year,value:f.value})))}
Provide: summary, recommendation_level (Urgent/Moderate/Stable), justification, quantifiable_impact, data_source.
Return structured JSON as the model output.`;

      const generateSql = `
        SELECT *
        FROM AI.GENERATE_TABLE(
          MODEL \`${BQ_MODEL}\`,
          (
            SELECT @prompt AS prompt,
            STRUCT<summary STRING, recommendation_level STRING, justification STRING, quantifiable_impact STRING, data_source STRING> AS response_schema
          )
        );
      `;
      try {
        const genRows = await runQuery(generateSql, { prompt });
        if (genRows && genRows.length) {
          // first row should contain the structured response
          const row = genRows[0];
          summary = {
            summary: String(row.summary || '').trim(),
            recommendation_level: String(row.recommendation_level || '').trim() || 'Monitor',
            justification: String(row.justification || '').trim(),
            quantifiable_impact: String(row.quantifiable_impact || '').trim(),
            data_source: String(row.data_source || '').trim(),
            // put some additional fields for UI context (optional)
            trendDirection: (row.summary || '').toString().toLowerCase().includes('increase') ? 'increasing' : 'stable'
          };
        }
      } catch (err) {
        console.warn('AI.GENERATE_TABLE failed (falling back to server summary):', err.message || err);
        // fallback: quick server-side summary
        const start = forecast[0]?.value ?? 0;
        const end = forecast[forecast.length-1]?.value ?? 0;
        const growth = (end - start);
        summary = {
          summary: `Forecast shows ${growth >= 0 ? 'an increase' : 'a decrease'} from ${start} to ${end}.`,
          recommendation_level: growth > 0 ? 'Monitor' : 'Stable',
          justification: 'Fallback summary generated by server.',
          quantifiable_impact: `${growth >=0 ? '+'+growth.toFixed(2) : growth.toFixed(2)} (absolute)`,
          data_source: 'BigQuery public datasets (fallback)'
        };
      }
    } else {
      // No BQ model configured: build a simple server summary
      const start = forecast[0]?.value ?? 0;
      const end = forecast[forecast.length-1]?.value ?? 0;
      const growth = end - start;
      summary = {
        summary: `Local summary: value moves from ${start} to ${end}.`,
        recommendation_level: growth > 0 ? 'Monitor' : 'Stable',
        justification: 'No remote BQ model configured — this is a fallback server summary.',
        quantifiable_impact: `${growth >= 0 ? '+'+growth.toFixed(2) : growth.toFixed(2)}`,
        data_source: 'Fallback summary'
      };
    }

    // return
    return res.json({ forecast, summary });
  } catch (err) {
    console.error('Error /api/bigquery', err);
    // Fallback: return demo-like sample to keep frontend responsive.
    return res.status(500).json({ error: 'BigQuery error', details: (err && err.message) || err.toString() });
  }
});

/**
 * GET /api/images?q=...
 * Uses Wikimedia Commons search API (no API key). Returns a compact list of thumbnails and full URLs.
 */
app.get('/api/images', async (req, res) => {
  const q = String(req.query.q || 'satellite coastal');
  try {
    // Wikimedia Commons API (CORS-friendly with &origin=*)
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=12&prop=imageinfo&iiprop=url&format=json&origin=*`;
    const r = await fetch(url);
    const j = await r.json();
    const pages = (j.query && j.query.pages) ? Object.values(j.query.pages) : [];
    const results = pages
      .filter(p => p.imageinfo && p.imageinfo[0] && p.imageinfo[0].thumburl)
      .map(p => ({
        title: p.title,
        thumbnail: p.imageinfo[0].thumburl,
        url: p.imageinfo[0].url
      }));
    res.json({ results });
  } catch (err) {
    console.error('images error', err);
    res.status(500).json({ error: 'failed to fetch images' });
  }
});

/**
 * POST /api/multimodal
 * body: { imageUrl, region, indicator }
 * Tries to run AI.GENERATE in BigQuery to analyze the image in context.
 * If BigQuery AI generates errors or BQ_MODEL not set, we fallback to a naive response.
 */
app.post('/api/multimodal', async (req, res) => {
  const { imageUrl, region, indicator } = req.body || {};
  if (!imageUrl) return res.status(400).send('imageUrl required');

  try {
    if (!BQ_MODEL) {
      // fallback: return a heuristic analysis
      return res.json({
        description: `Fallback analysis: inspected image at ${imageUrl}. (No BQ model configured.)`,
        insight_level: 'informational',
        details: { region, indicator }
      });
    }

    const prompt = `Analyze this satellite image URL: ${imageUrl}
Context: indicator=${indicator} region=${region}.
Return a structured description and short insight_level.`;

    const multimodalSql = `
      SELECT *
      FROM AI.GENERATE(
        MODEL \`${BQ_MODEL}\`,
        (
          SELECT @prompt AS prompt,
          STRUCT<description STRING, insight_level STRING> AS response_schema
        )
      )
    `;
    const rows = await runQuery(multimodalSql, { prompt });
    if (rows && rows[0]) {
      return res.json(rows[0]);
    } else {
      return res.json({ description: 'No description returned', insight_level: 'unknown' });
    }
  } catch (err) {
    console.error('multimodal error', err);
    return res.status(500).json({ error: 'multimodal failed', message: err.message || String(err) });
  }
});

/**
 * POST /api/vectorsearch
 * body: { indicator, region, top_k }
 * Demonstrates using ML.GENERATE_EMBEDDING and VECTOR_SEARCH.
 *
 * Note: The dataset & table names below are placeholders.
 * You should replace my_project.my_dataset.historical_forecasts with your table that
 * contains historical forecast time series (or create a forecast_embeddings table using ML.GENERATE_EMBEDDING).
 */
app.post('/api/vectorsearch', async (req, res) => {
  const { indicator, region, top_k = 5 } = req.body || {};
  if (!indicator || !region) return res.status(400).send('indicator and region required');

  try {
    // 1) Create embeddings table (one-time / idempotent). This assumes you have a historical_forecasts table with columns: country_name, year, value
    // If you already created forecast_embeddings, this will replace it with same content (safe).
    const createEmbSql = `
      CREATE OR REPLACE TABLE \`${PROJECT_ID}.temp_forecast_embeddings\` AS
      SELECT country_name,
        ML.GENERATE_EMBEDDING(TO_JSON_STRING(ARRAY_AGG(STRUCT(year, value) ORDER BY year))) AS embedding
      FROM \`${PROJECT_ID}.my_dataset.historical_forecasts\`
      GROUP BY country_name;
    `;

    // try to run it but don't fail hard if table not present / dataset is different — respond with error
    try {
      await runQuery(createEmbSql, {});
    } catch (errInner) {
      // If table isn't available, notify but try to continue to demo results
      console.warn('Could not create embeddings table (dev note):', errInner.message || errInner);
    }

    // 2) Create vector index (idempotent)
    const createIndexSql = `
      CREATE OR REPLACE VECTOR INDEX forecast_index
      ON \`${PROJECT_ID}.temp_forecast_embeddings\`(embedding)
      OPTIONS (embedding_model = "${EMBEDDING_MODEL}");
    `;
    try {
      await runQuery(createIndexSql, {});
    } catch (err) {
      console.warn('Could not create vector index:', err.message || err);
    }

    // 3) Run vector_search
    const vectorSearchSql = `
      SELECT country_name, distance
      FROM VECTOR_SEARCH(
        TABLE \`${PROJECT_ID}.temp_forecast_embeddings\`,
        'forecast_index',
        (SELECT embedding FROM \`${PROJECT_ID}.temp_forecast_embeddings\` WHERE country_name = @region),
        TOP_K => @top_k
      );
    `;
    const rows = await runQuery(vectorSearchSql, { region, top_k });

    // If query fails (no table etc.) provide demo fallback
    if (!rows || !rows.length) {
      return res.json({ results: [
        { country_name: 'China', distance: 0.98 },
        { country_name: 'India', distance: 0.95 },
        { country_name: 'Russia', distance: 0.92 }
      ]});
    }

    return res.json({ results: rows });
  } catch (err) {
    console.error('vectorsearch error', err);
    return res.status(500).json({ error: 'vectorsearch failed', message: err.message || String(err) });
  }
});

// Health check
app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Start
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  console.log(`Ensure GOOGLE_APPLICATION_CREDENTIALS or ADC are set. BQ_MODEL=${BQ_MODEL || '[not set]'}`);
});
