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
  const baseUrl =
    "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo";
  const serviceKey =
    "2590793aa81a12cb3d2e660ad6e105a519dc7c7a9d6c0f2dc3b41fb7c49f3e6e";

  try {
    // 요청 본문에서 종목명 추출
    const bodyText = await req.text();
    let params: URLSearchParams = new URLSearchParams();

    if (bodyText) {
      try {
        const decodedBody = decodeURIComponent(bodyText);
        params = new URLSearchParams(decodedBody);
      } catch {
        params = new URLSearchParams(bodyText);
      }
    }

    // 종목명 추출 (itmsNm 또는 기존 파라미터에서 추출)
    const itmsNm =
      params.get("itmsNm") || params.get("codeNmisuCd_finder_stkisu0_0");

    if (!itmsNm) {
      return setCorsHeaders(
        NextResponse.json(
          { error: "종목명(itmsNm)이 필요합니다." },
          { status: 400 }
        )
      );
    }

    // 오늘 날짜를 YYYYMMDD 형식으로 생성
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const basDt = `${year}${month}${day}`;

    // 공공데이터포털 API 파라미터 구성 (오늘 날짜로 먼저 시도)
    const apiParams = new URLSearchParams({
      serviceKey: serviceKey,
      resultType: "json",
      itmsNm: itmsNm,
      basDt: basDt, // 오늘 날짜 지정
    });

    let url = `${baseUrl}?${apiParams.toString()}`;
    let response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      const errorText = await response.text();
      return setCorsHeaders(
        NextResponse.json(
          { error: "Failed to fetch data", details: errorText },
          { status: response.status }
        )
      );
    }

    let data = await response.json();
    let items = data?.response?.body?.items?.item;

    // 오늘 날짜 데이터가 없으면 basDt 없이 다시 요청
    if (!items || (Array.isArray(items) && items.length === 0)) {
      const apiParamsWithoutDate = new URLSearchParams({
        serviceKey: serviceKey,
        resultType: "json",
        itmsNm: itmsNm,
      });
      url = `${baseUrl}?${apiParamsWithoutDate.toString()}`;
      response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        const errorText = await response.text();
        return setCorsHeaders(
          NextResponse.json(
            { error: "Failed to fetch data", details: errorText },
            { status: response.status }
          )
        );
      }

      data = await response.json();
      items = data?.response?.body?.items?.item;

      if (!items || (Array.isArray(items) && items.length === 0)) {
        return setCorsHeaders(
          NextResponse.json(
            { error: "주가 데이터를 찾을 수 없습니다." },
            { status: 404 }
          )
        );
      }
    }

    // 배열이 아니면 단일 객체로 변환
    const itemArray = Array.isArray(items) ? items : [items];

    // basDt 기준으로 정렬하여 가장 최신 데이터 찾기
    const sortedItems = itemArray.sort((a, b) => {
      const dateA = parseInt(a.basDt || "0");
      const dateB = parseInt(b.basDt || "0");
      return dateB - dateA; // 내림차순 정렬
    });

    // 오늘 날짜 데이터가 있으면 사용, 없으면 가장 최신 데이터 사용
    const todayItem = sortedItems.find((item) => item.basDt === basDt);
    const latestItem = todayItem || sortedItems[0];

    // 주가(clpr)만 반환
    return setCorsHeaders(
      NextResponse.json({
        clpr: latestItem.clpr,
        basDt: latestItem.basDt,
        itmsNm: latestItem.itmsNm,
      })
    );
  } catch (error) {
    console.error("Error:", error);
    return setCorsHeaders(
      NextResponse.json(
        {
          error: "An error occurred",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      )
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
