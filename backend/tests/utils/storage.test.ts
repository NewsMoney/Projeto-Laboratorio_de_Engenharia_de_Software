import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from "vitest";

import {
  normalizeKey,
  ensureTrailingSlash,
  buildUploadUrl,
  buildAuthHeaders,
  storagePut,
  storageGet,
  buildDownloadUrl,
} from "../../server/storage";

/* ------------------------------------------------ */
/* ENV Mock */
/* ------------------------------------------------ */

vi.mock("../../server/env", () => ({
  ENV: {
    forgeApiUrl:
      "https://storage.test",
    forgeApiKey:
      "secret-key",
  },
}));

/* ------------------------------------------------ */
/* Fetch Mock */
/* ------------------------------------------------ */

const mockFetch = vi.fn();

global.fetch =
  mockFetch as any;

/* ------------------------------------------------ */
/* Reset */
/* ------------------------------------------------ */

beforeEach(() => {
  vi.clearAllMocks();
});

/* ------------------------------------------------ */
/* normalizeKey */
/* ------------------------------------------------ */

describe(
  "normalizeKey",
  () => {
    it(
      "removes leading slashes",
      () => {
        expect(
          normalizeKey(
            "/test/file.png"
          )
        ).toBe(
          "test/file.png"
        );

        expect(
          normalizeKey(
            "///test/file.png"
          )
        ).toBe(
          "test/file.png"
        );
      }
    );

    it(
      "keeps normal paths unchanged",
      () => {
        expect(
          normalizeKey(
            "folder/file.png"
          )
        ).toBe(
          "folder/file.png"
        );
      }
    );
  }
);

/* ------------------------------------------------ */
/* ensureTrailingSlash */
/* ------------------------------------------------ */

describe(
  "ensureTrailingSlash",
  () => {
    it(
      "adds trailing slash",
      () => {
        expect(
          ensureTrailingSlash(
            "https://api.test"
          )
        ).toBe(
          "https://api.test/"
        );
      }
    );

    it(
      "does not duplicate slash",
      () => {
        expect(
          ensureTrailingSlash(
            "https://api.test/"
          )
        ).toBe(
          "https://api.test/"
        );
      }
    );
  }
);

/* ------------------------------------------------ */
/* buildUploadUrl */
/* ------------------------------------------------ */

describe(
  "buildUploadUrl",
  () => {
    it(
      "builds correct upload url",
      () => {
        const result =
          buildUploadUrl(
            "https://api.test",
            "/folder/file.png"
          );

        expect(
          result.toString()
        ).toBe(
          "https://api.test/v1/storage/upload?path=folder%2Ffile.png"
        );
      }
    );
  }
);

/* ------------------------------------------------ */
/* buildAuthHeaders */
/* ------------------------------------------------ */

describe(
  "buildAuthHeaders",
  () => {
    it(
      "builds bearer auth header",
      () => {
        expect(
          buildAuthHeaders(
            "abc123"
          )
        ).toEqual({
          Authorization:
            "Bearer abc123",
        });
      }
    );
  }
);

/* ------------------------------------------------ */
/* buildDownloadUrl */
/* ------------------------------------------------ */

describe(
  "buildDownloadUrl",
  () => {
    it(
      "returns download url",
      async () => {
        mockFetch.mockResolvedValue(
          {
            ok: true,

            json:
              vi.fn().mockResolvedValue(
                {
                  url: "https://download.test/file.png",
                }
              ),
          }
        );

        const result =
          await buildDownloadUrl(
            "https://api.test",
            "file.png",
            "token"
          );

        expect(result).toBe(
          "https://download.test/file.png"
        );

        expect(
          mockFetch
        ).toHaveBeenCalled();
      }
    );

    it(
      "throws on failed request",
      async () => {
        mockFetch.mockResolvedValue(
          {
            ok: false,

            status: 500,

            statusText:
              "Internal Error",

            text: vi
              .fn()
              .mockResolvedValue(
                "server exploded"
              ),
          }
        );

        await expect(
          buildDownloadUrl(
            "https://api.test",
            "file.png",
            "token"
          )
        ).rejects.toThrow(
          "Storage download URL failed"
        );
      }
    );

    it(
      "throws when response has no url",
      async () => {
        mockFetch.mockResolvedValue(
          {
            ok: true,

            json:
              vi.fn().mockResolvedValue(
                {}
              ),
          }
        );

        await expect(
          buildDownloadUrl(
            "https://api.test",
            "file.png",
            "token"
          )
        ).rejects.toThrow(
          "missing url field"
        );
      }
    );
  }
);

/* ------------------------------------------------ */
/* storagePut */
/* ------------------------------------------------ */

describe(
  "storagePut",
  () => {
    it(
      "uploads successfully",
      async () => {
        mockFetch.mockResolvedValue(
          {
            ok: true,

            json:
              vi.fn().mockResolvedValue(
                {
                  url: "https://cdn.test/file.png",
                }
              ),
          }
        );

        const result =
          await storagePut(
            "/folder/file.png",
            "hello world",
            "text/plain"
          );

        expect(result).toEqual({
          key: "folder/file.png",

          url: "https://cdn.test/file.png",
        });

        expect(
          mockFetch
        ).toHaveBeenCalled();
      }
    );

    it(
      "throws on upload failure",
      async () => {
        mockFetch.mockResolvedValue(
          {
            ok: false,

            status: 403,

            statusText:
              "Forbidden",

            text: vi
              .fn()
              .mockResolvedValue(
                "invalid token"
              ),
          }
        );

        await expect(
          storagePut(
            "file.png",
            "content"
          )
        ).rejects.toThrow(
          "Storage upload failed"
        );
      }
    );

    it(
      "throws when upload response has no url",
      async () => {
        mockFetch.mockResolvedValue(
          {
            ok: true,

            json:
              vi.fn().mockResolvedValue(
                {}
              ),
          }
        );

        await expect(
          storagePut(
            "file.png",
            "content"
          )
        ).rejects.toThrow(
          "missing url field"
        );
      }
    );
  }
);

/* ------------------------------------------------ */
/* storageGet */
/* ------------------------------------------------ */

describe(
  "storageGet",
  () => {
    it(
      "returns normalized key and url",
      async () => {
        mockFetch.mockResolvedValue(
          {
            ok: true,

            json:
              vi.fn().mockResolvedValue(
                {
                  url: "https://download.test/file.png",
                }
              ),
          }
        );

        const result =
          await storageGet(
            "/folder/file.png"
          );

        expect(result).toEqual({
          key: "folder/file.png",

          url: "https://download.test/file.png",
        });
      }
    );
  }
);