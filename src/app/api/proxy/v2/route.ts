import { NextRequest, NextResponse } from "next/server";

// CORS 설정 함수
function setCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*"); // 모든 도메인 허용
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
  try {
    // 요청 본문에서 url, method, contentType 및 나머지 데이터를 추출
    const {
      url,
      method = "POST",
      contentType = "application/json",
      ...body
    } = await req.json();

    // URL이 없는 경우 에러 반환
    if (!url) {
      return NextResponse.json(
        { error: "Missing 'url' in request body" },
        { status: 400 }
      );
    }

    // 요청에 사용할 HTTP 메서드를 대문자로 변환 (기본값은 "POST")
    const proxyMethod = method.toUpperCase();

    // fetch 옵션 구성 (GET 요청인 경우 body를 포함하지 않음)
    const fetchOptions: RequestInit = {
      method: proxyMethod,
      headers: {
        "Content-Type": contentType,
      },
    };
    if (proxyMethod !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    // 프록시 요청 보내기
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data from the provided URL" },
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
