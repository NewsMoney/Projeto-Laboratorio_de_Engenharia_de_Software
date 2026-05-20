import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Request,
} from "express";

import {
  getSessionCookieOptions,
} from "../../server/cookies";

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

function createRequest(
  secure: boolean
) {
  return {
    secure,
  } as Request;
}

/* ------------------------------------------------ */
/* Tests */
/* ------------------------------------------------ */

describe(
  "getSessionCookieOptions",
  () => {
    it(
      "returns non-secure cookies even on HTTPS (AWS compatibility)",
      () => {
        const result =
          getSessionCookieOptions(
            createRequest(true)
          );

        // Alterado para esperar false, acompanhando a mudança no código
        expect(
          result.secure
        ).toBe(false);
      }
    );
    
    it(
      "returns non-secure cookies on HTTP",
      () => {
        const result =
          getSessionCookieOptions(
            createRequest(false)
          );

        expect(
          result.secure
        ).toBe(false);
      }
    );

    it(
      "uses httpOnly",
      () => {
        const result =
          getSessionCookieOptions(
            createRequest(false)
          );

        expect(
          result.httpOnly
        ).toBe(true);
      }
    );

    it(
      "uses lax sameSite policy",
      () => {
        const result =
          getSessionCookieOptions(
            createRequest(false)
          );

        expect(
          result.sameSite
        ).toBe("lax");
      }
    );

    it(
      "uses root path",
      () => {
        const result =
          getSessionCookieOptions(
            createRequest(false)
          );

        expect(
          result.path
        ).toBe("/");
      }
    );

    it(
      "uses one year maxAge",
      () => {
        const result =
          getSessionCookieOptions(
            createRequest(false)
          );

        expect(
          result.maxAge
        ).toBe(
          1000 *
            60 *
            60 *
            24 *
            365
        );
      }
    );
  }
);