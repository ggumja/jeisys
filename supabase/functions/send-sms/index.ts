import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { 
      historyId, 
      fromPhone, 
      subject, 
      message, 
      recipients, 
      reservedAt,
      storeId 
    } = body

    console.log(`[send-sms] New Request: HistoryID=${historyId}, StoreID=${storeId}, Recipients=${recipients?.length}`)

    // 2. Validation
    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients provided')
    }

    // 3. 실제 MTS API 연동 로직
    const MTS_API_URL = "https://wmmbouchli.execute-api.ap-northeast-2.amazonaws.com/prod/smallbee/store/sms/requestbulkmessage"
    
    // MTS 규격에 맞게 수신자 목록 변환
    const userList = recipients.map((r: any) => ({
      phoneNumber: r.phone.replace(/[^0-9]/g, ''), // 숫자만 추출
      name: r.name,
      pointAmount: r.points || 0
    }))

    const mtsPayload = {
      storeId,
      fromPhoneNumber: fromPhone.replace(/[^0-9]/g, ''),
      reservedSendDate: reservedAt ? reservedAt.replace('T', ' ').substring(0, 19) : null,
      purpose: 'mkt',
      subject: subject || null,
      message,
      attachedUrl: body.attachedUrls || null,
      userList
    }

    console.log(`[send-sms] Calling MTS API for ${userList.length} recipients...`)

    const response = await fetch(MTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
      },
      body: JSON.stringify(mtsPayload)
    })

    const textData = await response.text();
    let mtsResult;
    try {
      mtsResult = JSON.parse(textData);
    } catch (e) {
      throw new Error(`MTS Server returned non-JSON response (${response.status}): ${textData}`);
    }

    if (!response.ok || mtsResult.code !== 200) {
      console.error("[send-sms] MTS API Error:", mtsResult)
      throw new Error(`MTS API failed: ${mtsResult.message || response.statusText}`)
    }

    console.log(`[send-sms] MTS API Success: ${mtsResult.message}`)

    // 4. 성공 응답 반환
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'MTS 발송 요청 성공',
        mtsResponse: mtsResult,
        historyId,
        count: recipients.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error("[send-sms] Function error:", error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})
