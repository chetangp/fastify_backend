'use strict';

const logger = require('../utils/logger');

async function processRequest(pg, body) {
  logger.info('Received request', { cmd: body.cmd });

  if (body.cmd === '3') {
    return await handleCmd3(pg, body);
  } else if (['1', '2', '4'].includes(body.cmd)) {
    return await handleStandardCommand(pg, body);
  } else {
    return { success: false, message: 'Invalid command', statusCode: 400 };
  }
}

async function handleCmd3(pg, body) {
  try {
    const schema = 'mobile_user';
    const classNum = body.class;
    const activity_id = body.id;
    const tableName = `class${classNum}_activity_info`;
    const getRefQuery = {
      text: `
          SELECT asset_table_reference
          FROM ${schema}.${tableName} WHERE activity_id=$1;
        `,
      values: [activity_id],
      statement_timeout: 5000, // 5 second timeout
    };

    const refResult = await pg.query(getRefQuery);

    if (refResult.rows && refResult.rows.length > 0) {
      const asset_table_reference = refResult.rows[0].asset_table_reference;
      const parts = asset_table_reference.split('.');
      const assert_schema = parts[0];
      const assert_table = parts[1];

      const getDataQuery = {
        text: `
            SELECT * FROM "${assert_schema}"."${assert_table}"  ORDER BY "order_index" ASC;
        `,
        statement_timeout: 5000, // 5 second timeout
      };

      const dataResult = await pg.query(getDataQuery);

      return { success: true, data: dataResult.rows };
    } else {
      return { success: false, message: 'Asset table reference not found', statusCode: 404 };
    }
  } catch (error) {
    logger.error('Error handling cmd 3', { error: error.message });
    throw error;
  }
}

async function handleStandardCommand(pg, body) {
  try {
    const queryData = generateQuery(body);

    if (body.cmd === '1' && queryData.query && queryData.query2 && queryData.query3) {
      return await handleCmd1WithMerge(pg, queryData);
    } else if (queryData.query) {
      const result = await pg.query({text: queryData.query, statement_timeout: 5000});
      return { success: true, data: result.rows };
    } else {
      return { success: false, message: 'Failed to generate query', statusCode: 400 };
    }
  } catch (error) {
    logger.error('Error handling standard command', { error: error.message });
    throw error;
  }
}

async function handleCmd1WithMerge(pg, queryData) {
  try {
    logger.info('Executing queries for cmd 1:', {
      query1: queryData.query,
      query2: queryData.query2,
      query3: queryData.query3
    });

    const [result1, result2, result3] = await Promise.all([
      pg.query({text: queryData.query, statement_timeout: 5000}),
      pg.query({text: queryData.query2, statement_timeout: 5000}),
      pg.query({text: queryData.query3, statement_timeout: 5000})
    ]);

    logger.info('Query results for cmd 1:', {
      query1_rowCount: result1.rowCount,
      query2_rowCount: result2.rowCount,
      query3_rowCount: result3.rowCount
    });

    const activityDetails = result1.rows || [];
    const progressData = result2.rows || [];
    const lockedData = result3.rows || [];

    return {
      success: true,
      data: {
        activityDetails,
        progressData,
        lockedData
      }
    };
  } catch (error) {
    logger.error('Error handling cmd 1 with merge', { error: error.message });
    throw error;
  }
}

function generateQuery(body) {
    const cmd = body.cmd;
    let query = "";
    let query2 = "";
    let query3 = "";

    switch (cmd) {
        case '1': {
            let schema = "mobile_user";
            if (body.role === "tester") {
                schema = "test_user";
            }
            const classNum = body.class;
            const mail = body.mail || body.user;
            const user = (mail || "").toString().replace(/[^a-zA-Z0-9_]/g, "_") || "samkirma4_gmail_com";
            const tableName = `class${classNum}_activity_info`;

            query = `
              SELECT activity_id , activity_name , series_num  , description , outcome , subject  
              FROM ${schema}.${tableName};
            `;
            query2 = `
              SELECT activity_id , slide_num, answer_cnt , activity_complete , total_q_slide , slide_complete , act_complete_bool
              FROM user_tracking.${user};
            `;
            query3 = `
              select locked from mobile_user.user_tokens where email = '${mail}';
            `;
            break;
        }
        case '2': {
            const user = (body.user || body.mail || "").toString().replace(/[^a-zA-Z0-9_]/g, "_") || "samkirma4_gmail_com";
            const isComplete = Boolean(body.isComplete) || false;
            const activity_id = body.id;

            if (isComplete) {
                query = `
                 update user_tracking.${user} set  activity_complete = ${isComplete} where activity_id=${activity_id};
                `;
            } else {
                query = `
                  SELECT activity_id , slide_num, answer_cnt , activity_complete , total_q_slide , slide_complete , act_complete_bool
                  FROM user_tracking.${user}
                  WHERE activity_id = ${activity_id};
                `;
            }
            break;
        }
        case '4': {
            const email = body.user;
            query = `
                select p_input_token, p_output_token, p_total from  mobile_user.user_tokens where email='${email}';
                `;
            break;
        }
        default:
            logger.warn('Invalid command', { cmd });
            break;
    }

    return { query, query2, query3 };
}

module.exports = {
  processRequest
};