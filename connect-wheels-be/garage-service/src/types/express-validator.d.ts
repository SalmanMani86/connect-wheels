/** Type declaration for express-validator (helps IDE resolve the module) */
declare module 'express-validator' {
  import { Request } from 'express';

  export function body(field: string, message?: string): any;
  export function param(field: string, message?: string): any;
  export function query(field: string, message?: string): any;
  export function validationResult(req: Request): {
    isEmpty: () => boolean;
    array: () => any[];
  };
}
