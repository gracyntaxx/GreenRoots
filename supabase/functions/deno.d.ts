declare module "https://esm.sh/@supabase/supabase-js@2.45.4" {
  export * from "@supabase/supabase-js";
}

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
  export function serve(
    handler: (req: Request) => Promise<Response> | Response
  ): void;
  export function serve(
    options: { port?: number; hostname?: string },
    handler: (req: Request) => Promise<Response> | Response
  ): void;
}
