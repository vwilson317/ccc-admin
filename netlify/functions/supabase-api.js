const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    // Parse the request body if it exists
    const body = event.body ? JSON.parse(event.body) : {}
    const { action, table, data, filters } = body

    let result

    switch (action) {
      case 'select':
        result = await supabase
          .from(table)
          .select('*')
          .match(filters || {})
        break
      
      case 'insert':
        result = await supabase
          .from(table)
          .insert(data)
        break
      
      case 'update':
        result = await supabase
          .from(table)
          .update(data)
          .match(filters || {})
        break
      
      case 'delete':
        result = await supabase
          .from(table)
          .delete()
          .match(filters || {})
        break
      
      default:
        throw new Error('Invalid action specified')
    }

    if (result.error) throw result.error

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.data)
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
