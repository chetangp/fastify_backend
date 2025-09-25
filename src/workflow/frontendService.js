'use strict';

const { executeQuery } = require('../utils/db');
const { logger } = require('../utils/logger');

/**
 * Generate SQL query based on command type
 * @param {Object} body - The request body
 * @returns {Object} Object containing query, query2, and query3
 */
function generateQuery(body) {
  const cmd = body.cmd;
  let query = '';
  let query2 = '';
  let query3 = '';

  switch (cmd) {
    case '1': {
      let schema = 'mobile_user';
      if (body.role === 'tester') {
        schema = 'test_user';
      }
      const classNum = body.class;
      const user = (body.mail || '').toString().replace(/[^a-zA-Z0-9_]/g, '_') || 'samkirma4_gmail_com';
      const mail = body.mail;
      const tableName = `class${classNum}_activity_info`;

      // Using parameterized queries is safer
      query = `SELECT activity_id , activity_name , series_num  , description , outcome , subject FROM ${schema}.${tableName};`;
      query2 = `SELECT activity_id , slide_num, answer_cnt , activity_complete , total_q_slide , slide_complete , act_complete_bool FROM user_tracking."${user}";`;
      query3 = `SELECT locked FROM mobile_user.user_tokens WHERE email = '${mail}';`; // Note: this is still vulnerable to SQLi. Should be parameterized.
      break;
    }
    case '2': {
      const user = (body.user || body.mail || '').toString().replace(/[^a-zA-Z0-9_]/g, '_') || 'samkirma4_gmail_com';
      const isComplete = Boolean(body.isComplete) || false;
      const activity_id = body.id;

      // Using parameterized queries is safer
      if (isComplete) {
        query = `UPDATE user_tracking."${user}" SET activity_complete = ${isComplete} WHERE activity_id=${activity_id};`;
      } else {
        query = `SELECT activity_id , slide_num, answer_cnt , activity_complete , total_q_slide , slide_complete , act_complete_bool FROM user_tracking."${user}" WHERE activity_id = ${activity_id};`;
      }
      break;
    }
    case '4': {
      const email = body.user;
      query = `SELECT p_input_token, p_output_token, p_total FROM mobile_user.user_tokens WHERE email='${email}';`; // Note: this is still vulnerable to SQLi. Should be parameterized.
      break;
    }
    default:
      logger.warn('Invalid command for query generation', { cmd });
      break;
  }

  return { query, query2, query3 };
}

/**
 * Handle command 1 which requires executing three queries and merging results
 * @param {Object} body - The request body
 */
async function handleCmd1(body) {
  const queryData = generateQuery(body);
  const [result1, result2, result3] = await Promise.all([
    executeQuery(queryData.query),
    executeQuery(queryData.query2),
    executeQuery(queryData.query3),
  ]);

  if (!result1.success || !result2.success || !result3.success) {
    const errorDetails = [result1.error, result2.error, result3.error].filter(Boolean);
    logger.error('One or more queries failed for cmd 1', { errorDetails });
    throw new Error('One or more queries failed');
  }

  return {
    activityDetails: result1.data || [],
    progressData: result2.data || [],
    lockedData: result3.data || [],
  };
}

/**
 * Handle command 3 which is a two-step query process
 * @param {Object} body - The request body
 */
async function handleCmd3(body) {
  const schema = 'mobile_user';
  const classNum = body.class;
  const activity_id = body.id;
  const tableName = `class${classNum}_activity_info`;
  const getRefQuery = `SELECT asset_table_reference FROM ${schema}.${tableName} WHERE activity_id='${activity_id}';`;

  const refResult = await executeQuery(getRefQuery);

  if (refResult.success && refResult.data && refResult.data.length > 0) {
    const asset_table_reference = refResult.data[0].asset_table_reference;
    const parts = asset_table_reference.split('.');
    const assert_schema = parts[0];
    const assert_table = parts[1];

    const getDataQuery = `SELECT * FROM "${assert_schema}"."${assert_table}" ORDER BY "order_index" ASC;`;
    const dataResult = await executeQuery(getDataQuery);

    if (dataResult.success) {
      return dataResult.data;
    }
    logger.error('Failed to get asset data', { details: dataResult.error });
    throw new Error('Failed to get asset data');
  }
  throw new Error('Asset table reference not found');
}

/**
 * Handle standard commands (2, 4)
 * @param {Object} body - The request body
 */
async function handleStandardCommand(body) {
  const queryData = generateQuery(body);
  if (queryData.query) {
    const result = await executeQuery(queryData.query);
    if (result.success) {
      return result.data;
    }
    logger.error('Query failed for standard command', { details: result.error });
    throw new Error('Query failed');
  }
  throw new Error('Failed to generate query');
}

module.exports = {
  handleCmd1,
  handleCmd3,
  handleStandardCommand,
};