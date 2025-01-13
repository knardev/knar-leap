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
    // 요청 본문 가져오기
    const { url, ...body } = await req.json();

    // URL이 없는 경우 에러 반환
    if (!url) {
      return NextResponse.json(
        { error: "Missing 'url' in request body" },
        { status: 400 }
      );
    }

    // 프록시 요청 보내기
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

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
