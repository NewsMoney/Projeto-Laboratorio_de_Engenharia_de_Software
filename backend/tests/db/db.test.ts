import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from "vitest";

import bcrypt from "bcryptjs";

import {
  registerUser,
  loginUser,
  getUserById,
  getUserByEmail,
  updateUserProfile,
  createPlace,
  createCheckin,
  getUserStats,
} from "../../server/db";

/* ------------------------------------------------ */
/* Mock bcrypt */
/* ------------------------------------------------ */

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

/* ------------------------------------------------ */
/* Mock drizzle schema */
/* ------------------------------------------------ */

vi.mock(
  "../../backend/drizzle/schema",
  () => ({
    users: {
      id: "id",
      email: "email",
      username: "username",
      createdAt:
        "createdAt",
      role: "role",
    },

    places: {
      id: "id",
      createdAt:
        "createdAt",
      name: "name",
    },

    checkins: {
      id: "id",
      userId: "userId",
      placeId: "placeId",
      rating: "rating",
    },
  })
);

/* ------------------------------------------------ */
/* DB Mock */
/* ------------------------------------------------ */

const mockDb = {
  select: vi.fn(),

  insert: vi.fn(),

  update: vi.fn(),
};

vi.mock(
  "drizzle-orm/mysql2",
  () => ({
    drizzle: vi.fn(
      () => mockDb
    ),
  })
);

/* ------------------------------------------------ */
/* ENV */
/* ------------------------------------------------ */

process.env.DATABASE_URL =
  "mysql://test";

/* ------------------------------------------------ */
/* Reset */
/* ------------------------------------------------ */

beforeEach(() => {
  vi.clearAllMocks();
});

/* ------------------------------------------------ */
/* getUserById */
/* ------------------------------------------------ */

describe(
  "getUserById",
  () => {
    it(
      "returns user",
      async () => {
        mockDb.select.mockReturnValue(
          {
            from:
              vi.fn(() => ({
                where:
                  vi.fn(() => ({
                    limit:
                      vi
                        .fn()
                        .mockResolvedValue(
                          [
                            {
                              id: 1,
                              name:
                                "John",
                            },
                          ]
                        ),
                  })),
              })),
          }
        );

        const result =
          await getUserById(
            1
          );

        expect(result).toEqual({
          id: 1,
          name: "John",
        });
      }
    );
  }
);

/* ------------------------------------------------ */
/* getUserByEmail */
/* ------------------------------------------------ */

describe(
  "getUserByEmail",
  () => {
    it(
      "normalizes email",
      async () => {
        mockDb.select.mockReturnValue(
          {
            from:
              vi.fn(() => ({
                where:
                  vi.fn(() => ({
                    limit:
                      vi
                        .fn()
                        .mockResolvedValue(
                          [
                            {
                              id: 1,
                              email:
                                "test@test.com",
                            },
                          ]
                        ),
                  })),
              })),
          }
        );

        const result =
          await getUserByEmail(
            "TEST@Test.com "
          );

        expect(
          result?.email
        ).toBe(
          "test@test.com"
        );
      }
    );
  }
);

/* ------------------------------------------------ */
/* registerUser */
/* ------------------------------------------------ */

describe(
  "registerUser",
  () => {
    it(
      "creates user successfully",
      async () => {
        mockDb.select

          .mockReturnValueOnce({
            from:
              vi.fn(() => ({
                where:
                  vi.fn(() => ({
                    limit:
                      vi
                        .fn()
                        .mockResolvedValue(
                          []
                        ),
                  })),
              })),
          })

          .mockReturnValueOnce({
            from:
              vi.fn(() => ({
                where:
                  vi.fn(() => ({
                    limit:
                      vi
                        .fn()
                        .mockResolvedValue(
                          []
                        ),
                  })),
              })),
          });

        mockDb.insert.mockReturnValue(
          {
            values:
              vi
                .fn()
                .mockResolvedValue(
                  [
                    {
                      insertId: 123,
                    },
                  ]
                ),
          }
        );

        vi.mocked(
          bcrypt.hash
        ).mockResolvedValue(
          "hashed-password" as never
        );

        const result =
          await registerUser(
            {
              name: "John",

              username:
                "john123",

              gender:
                "Masculino",

              email:
                "JOHN@test.com",

              password:
                "123456",

              birthDate:
                "2000-01-01",
            }
          );

        expect(result).toEqual({
          id: 123,
        });

        expect(
          bcrypt.hash
        ).toHaveBeenCalled();

        expect(
          mockDb.insert
        ).toHaveBeenCalled();
      }
    );

    it(
      "rejects duplicated email",
      async () => {
        mockDb.select.mockReturnValue(
          {
            from:
              vi.fn(() => ({
                where:
                  vi.fn(() => ({
                    limit:
                      vi
                        .fn()
                        .mockResolvedValue(
                          [
                            {
                              id: 1,
                            },
                          ]
                        ),
                  })),
              })),
          }
        );

        await expect(
          registerUser({
            name: "John",

            username:
              "john123",

            gender:
              "Masculino",

            email:
              "john@test.com",

            password:
              "123456",

            birthDate:
              "2000-01-01",
          })
        ).rejects.toThrow(
          "Email já cadastrado"
        );
      }
    );

    it(
      "rejects invalid birth date",
      async () => {
        await expect(
          registerUser({
            name: "John",

            username:
              "john123",

            gender:
              "Masculino",

            email:
              "john@test.com",

            password:
              "123456",

            birthDate:
              "invalid-date",
          })
        ).rejects.toThrow(
          "Invalid birth date"
        );
      }
    );
  }
);

/* ------------------------------------------------ */
/* loginUser */
/* ------------------------------------------------ */

describe(
  "loginUser",
  () => {
    it(
      "logs in with email",
      async () => {
        mockDb.select.mockReturnValue(
          {
            from:
              vi.fn(() => ({
                where:
                  vi.fn(() => ({
                    limit:
                      vi
                        .fn()
                        .mockResolvedValue(
                          [
                            {
                              id: 1,

                              email:
                                "john@test.com",

                              passwordHash:
                                "hash",
                            },
                          ]
                        ),
                  })),
              })),
          }
        );

        mockDb.update.mockReturnValue(
          {
            set: vi.fn(
              () => ({
                where:
                  vi
                    .fn()
                    .mockResolvedValue(
                      undefined
                    ),
              })
            ),
          }
        );

        vi.mocked(
          bcrypt.compare
        ).mockResolvedValue(
          true as never
        );

        const result =
          await loginUser(
            {
              email:
                "john@test.com",

              password:
                "123456",
            }
          );

        expect(
          result.id
        ).toBe(1);

        expect(
          bcrypt.compare
        ).toHaveBeenCalled();
      }
    );

    it(
      "rejects invalid password",
      async () => {
        mockDb.select.mockReturnValue(
          {
            from:
              vi.fn(() => ({
                where:
                  vi.fn(() => ({
                    limit:
                      vi
                        .fn()
                        .mockResolvedValue(
                          [
                            {
                              id: 1,
                              passwordHash:
                                "hash",
                            },
                          ]
                        ),
                  })),
              })),
          }
        );

        vi.mocked(
          bcrypt.compare
        ).mockResolvedValue(
          false as never
        );

        await expect(
          loginUser({
            email:
              "john@test.com",

            password:
              "wrong",
          })
        ).rejects.toThrow(
          "Senha incorreta"
        );
      }
    );

    it(
      "rejects missing credentials",
      async () => {
        await expect(
          loginUser({
            password:
              "123456",
          })
        ).rejects.toThrow(
          "Email ou username obrigatório"
        );
      }
    );
  }
);

/* ------------------------------------------------ */
/* updateUserProfile */
/* ------------------------------------------------ */

describe(
  "updateUserProfile",
  () => {
    it(
      "updates profile",
      async () => {
        mockDb.update.mockReturnValue(
          {
            set: vi.fn(
              () => ({
                where:
                  vi
                    .fn()
                    .mockResolvedValue(
                      undefined
                    ),
              })
            ),
          }
        );

        const result =
          await updateUserProfile(
            1,
            {
              bio: "hello",

              avatarUrl:
                "avatar.png",
            }
          );

        expect(result).toEqual({
          success: true,
        });
      }
    );
  }
);

/* ------------------------------------------------ */
/* createPlace */
/* ------------------------------------------------ */

describe(
  "createPlace",
  () => {
    it(
      "creates place",
      async () => {
        mockDb.insert.mockReturnValue(
          {
            values:
              vi
                .fn()
                .mockResolvedValue(
                  [
                    {
                      insertId: 10,
                    },
                  ]
                ),
          }
        );

        const result =
          await createPlace({
            name: "Café",
          } as any);

        expect(result).toEqual({
          id: 10,
        });
      }
    );
  }
);

/* ------------------------------------------------ */
/* createCheckin */
/* ------------------------------------------------ */

describe(
  "createCheckin",
  () => {
    it(
      "creates checkin",
      async () => {
        mockDb.insert.mockReturnValue(
          {
            values:
              vi
                .fn()
                .mockResolvedValue(
                  [
                    {
                      insertId: 99,
                    },
                  ]
                ),
          }
        );

        const result =
          await createCheckin({
            userId: 1,
            placeId: 1,
            rating: 5,
          } as any);

        expect(result).toEqual({
          id: 99,
        });
      }
    );
  }
);

/* ------------------------------------------------ */
/* getUserStats */
/* ------------------------------------------------ */

describe(
  "getUserStats",
  () => {
    it(
      "returns normalized stats",
      async () => {
        mockDb.select.mockReturnValue(
          {
            from:
              vi.fn(() => ({
                where:
                  vi
                    .fn()
                    .mockResolvedValue(
                      [
                        {
                          totalCheckins:
                            "10",

                          uniquePlaces:
                            "3",

                          avgRating:
                            "4.7",
                        },
                      ]
                    ),
              })),
          }
        );

        const result =
          await getUserStats(
            1
          );

        expect(result).toEqual({
          totalCheckins: 10,
          uniquePlaces: 3,
          avgRating: 4.7,
        });
      }
    );
  }
);