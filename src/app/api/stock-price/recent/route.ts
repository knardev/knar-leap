import { NextRequest, NextResponse } from "next/server";

// CORS 설정 함수
function setCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
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
    // 요청 본문에서 종목코드와 페이지 추출
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

    // 종목코드 추출
    let code = params.get("code");

    if (!code) {
      return setCorsHeaders(
        NextResponse.json(
          { error: "종목코드(code)가 필요합니다." },
          { status: 400 }
        )
      );
    }

    // 종목코드에서 공백 및 개행 문자 제거
    code = code.trim();

    // 페이지 번호 (기본값: 1)
    const page = params.get("page") || "1";

    // 기본 헤더 설정
    const baseHeaders = {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      "accept": "*/*",
      "accept-language": "en,en-US;q=0.9,ko;q=0.8",
      "accept-encoding": "gzip, deflate, br, zstd",
      "sec-ch-ua":
        '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    };

    try {
      // 1단계: 메인 페이지 GET 요청으로 JSESSIONID 쿠키 획득
      const mainUrl = `https://finance.naver.com/item/main.naver?code=${code}`;
      const mainResponse = await fetch(mainUrl, {
        method: "GET",
        headers: baseHeaders,
      });

      // Set-Cookie 헤더에서 쿠키 추출
      const setCookieHeaders = mainResponse.headers.getSetCookie();
      const cookies: string[] = [];

      if (setCookieHeaders && setCookieHeaders.length > 0) {
        // Set-Cookie 헤더를 Cookie 헤더 형식으로 변환
        setCookieHeaders.forEach((cookie) => {
          // Set-Cookie 형식: "JSESSIONID=xxx; Path=/; HttpOnly"
          // Cookie 헤더 형식: "JSESSIONID=xxx"
          cookies.push(cookie.split(";")[0].trim());
        });
      }

      // 네이버 금융에서 "최근 본 종목" 기능을 위해 필요한 쿠키 추가
      // 이 쿠키가 있어야 item_right_ajax.naver가 데이터를 반환함
      cookies.push(`naver_stock_codeList=${code}%7C`);
      cookies.push("summary_item_type=recent");

      const cookieString = cookies.join("; ");

      if (!cookieString) {
        return setCorsHeaders(
          NextResponse.json(
            {
              error: "쿠키를 획득할 수 없습니다.",
            },
            { status: 500 }
          )
        );
      }

      // 2단계: 쿠키를 포함해서 AJAX POST 요청
      const ajaxUrl = `https://finance.naver.com/item/item_right_ajax.naver?type=recent&code=${code}&page=${page}`;
      const requestBody = `type=recent&code=${code}&page=${page}`;

      const ajaxResponse = await fetch(ajaxUrl, {
        method: "POST",
        headers: {
          ...baseHeaders,
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
          "Cookie": cookieString,
          "Referer": mainUrl,
          "Origin": "https://finance.naver.com",
          "charset": "utf-8",
        },
        body: requestBody,
      });

      if (!ajaxResponse.ok) {
        return setCorsHeaders(
          NextResponse.json(
            {
              error: "AJAX 요청이 실패했습니다.",
              status: ajaxResponse.status,
              statusText: ajaxResponse.statusText,
            },
            { status: ajaxResponse.status }
          )
        );
      }

      // JSON 응답 파싱
      const data = await ajaxResponse.json();

      return setCorsHeaders(NextResponse.json(data));
    } catch (error) {
      console.error("Error fetching recent trades:", error);
      return setCorsHeaders(
        NextResponse.json(
          {
            error: "최근 체결 내역을 가져올 수 없습니다.",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        )
      );
    }
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
