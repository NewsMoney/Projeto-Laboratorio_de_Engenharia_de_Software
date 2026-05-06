/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

// Tente uma destas duas opções (a Opção 1 é a mais provável de funcionar agora):

// Opção 1: Usando o Alias com a extensão explícita
export type * from "@backend/drizzle/schema.ts"; 

// Opção 2 (Se a 1 falhar): Usando o caminho relativo com a extensão explícita
// export type * from "../../backend/drizzle/schema.ts";

export * from "./errors";
