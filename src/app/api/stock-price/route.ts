import { NextRequest, NextResponse } from "next/server";

// CORS 설정 함수
function setCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*"); // 허용할 도메인 (모든 도메인 허용: *)
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

// OPTIONS 요청 처리 (Preflight 요청)
export function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  return setCorsHeaders(response);
}

// POST 요청 처리
export async function POST(req: NextRequest) {
  const url = "http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd";
  const headers = {
    Referer:
      "http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020203",
    Origin: "http://data.krx.co.kr",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    // 요청 본문 가져오기
    const body = await req.text(); // URLSearchParams 형식 데이터로 변환된 문자열

    // KRX API로 요청 전송
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data from KRX API" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 응답에 CORS 헤더 추가
    const nextResponse = NextResponse.json(data);
    return setCorsHeaders(nextResponse);
  } catch (error) {
    console.error("Proxy error:", error);
    const nextResponse = NextResponse.json(
      { error: "An error occurred while processing the request." },
      { status: 500 }
    );
    return setCorsHeaders(nextResponse);
  }
}

// fetch("/api/proxy", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/x-www-form-urlencoded",
//   },
//   body: new URLSearchParams({
//     bld: "dbms/MDC/STAT/standard/MDCSTAT02102",
//     locale: "ko_KR",
//     tboxisuCd_finder_stkisu0_0: "499790/GS피앤엘",
//     isuCd: "KR7499790004",
//     isuCd2: "499790",
//     codeNmisuCd_finder_stkisu0_0: "GS피앤엘",
//     param1isuCd_finder_stkisu0_0: "ALL",
//     csvxls_isNo: "false",
//   }).toString(),
// })
//   .then((response) => response.json())
//   .then((data) => console.log(data))
//   .catch((error) => console.error("Error:", error));
