import { NextRequest } from 'next/server';

// Define the type for route handlers in Next.js App Router
export type RouteHandler<Params = Record<string, string>> = {
    (request: NextRequest, context: { params: Params }): Promise<Response>;
};
