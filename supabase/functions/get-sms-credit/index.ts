import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { storeId } = body;
    
    if (!storeId) {
      throw new Error('storeId is required');
    }

    // [변경] 안정적인 기본 AWS API Gateway 주소 사용
    const MTS_CREDIT_URL = `https://wmmbouchli.execute-api.ap-northeast-2.amazonaws.com/prod/smallbee/store/statistics/root/root/getsmscredit?storeId=${storeId}`
    
    console.log(`[get-sms-credit] Requesting with headers: ${MTS_CREDIT_URL}`)
    
    // [강화] 브라우저처럼 보이기 위한 헤더 추가
    const response = await fetch(MTS_CREDIT_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    })

    // 텍스트로 먼저 받아서 JSON 여부 파악 (Forbidden 방지)
    const textData = await response.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch (e) {
      throw new Error(`MTS Server returned non-JSON response (${response.status}): ${textData}`);
    }

    return new Response(
      JSON.stringify({ 
        success: data.code === 200,
        leftLmsAmount: data.payload?.leftLmsAmount ?? data.payload?.leftAmount ?? 0,
        payload: data.payload,
        fullResponse: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug_info: "Security policy might be blocking the request",
        stack: error.stack
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )
  }
})
