import { NextRequest, NextResponse } from "next/server";

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
    const body = await req.text(); // URLSearchParams를 보낼 경우, 문자열로 변환된 데이터 필요

    // KRX API에 요청 전송
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    // 응답 데이터 처리
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data from KRX API" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 클라이언트로 응답 전송
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request." },
      { status: 500 }
    );
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
