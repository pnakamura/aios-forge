/**
 * @agent     Utils
 * @persona   Utilitarios puros reutilizaveis
 * @commands  cn
 * @context   Funcao cn para merge de classes Tailwind. Usado em todos os componentes.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
