import {NextResponse} from 'next/server';

type PrintRequestBody = {
  locale?: string;
  mugType?: string;
  imageDataUrl?: string;
  printProfile?: {
    dpi?: number;
    templateWidthMm?: number;
    templateHeightMm?: number;
    safeZoneLeftMm?: number;
    safeZoneRightMm?: number;
    printableWidthMm?: number;
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as PrintRequestBody;

  if (!body.imageDataUrl?.startsWith('data:image/png;base64,')) {
    return NextResponse.json(
      {message: 'Print image is missing or invalid.'},
      {status: 400}
    );
  }

  const endpoint = process.env.PRINT_API_URL;

  if (!endpoint) {
    return NextResponse.json(
      {
        message:
          'PRINT_API_URL is not configured. The print-ready PNG was generated locally, but external forwarding is disabled.'
      },
      {status: 501}
    );
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (process.env.PRINT_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.PRINT_API_TOKEN}`;
  }

  const upstreamResponse = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      locale: body.locale,
      mugType: body.mugType,
      imageDataUrl: body.imageDataUrl,
      printProfile: body.printProfile
    }),
    cache: 'no-store'
  });

  const responseText = await upstreamResponse.text();

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      {
        message: `Print API request failed with status ${upstreamResponse.status}.`,
        upstream: responseText
      },
      {status: upstreamResponse.status}
    );
  }

  return NextResponse.json({
    message: 'Design was forwarded to the print API successfully.',
    upstream: responseText
  });
}
