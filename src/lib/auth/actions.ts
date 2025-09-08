"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { guests } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { and, eq, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { mergeCarts } from "../actions/cart";

const COOKIE_OPTIONS = {
  httpOnly: true as const,
  secure: true as const,
  sameSite: "strict" as const,
  path: "/" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8).max(128);
const nameSchema = z.string().min(1).max(100);

export async function createGuestSession() {
  const cookieStore = await cookies();
  const existing = (await cookieStore).get("guest_session");
  if (existing?.value) {
    // Verify the session still exists in DB
    const [existingGuest] = await db
        .select()
        .from(guests)
        .where(eq(guests.sessionToken, existing.value))
        .limit(1);

    if (existingGuest && existingGuest.expiresAt > new Date()) {
      return { ok: true, sessionToken: existing.value };
    }

    // Clean up expired session
    if (existingGuest) {
      await db.delete(guests).where(eq(guests.id, existingGuest.id));
    }
  }
  const sessionToken = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + COOKIE_OPTIONS.maxAge * 1000);

  await db.insert(guests).values({
    sessionToken,
    expiresAt,
  });

  (await cookieStore).set("guest_session", sessionToken, COOKIE_OPTIONS);
  return { ok: true, sessionToken };
}

export async function guestSession() {
  const cookieStore = await cookies();
  const token = (await cookieStore).get("guest_session")?.value;
  if (!token) {
    return { sessionToken: null };
  }
  const now = new Date();
  await db
    .delete(guests)
    .where(and(eq(guests.sessionToken, token), lt(guests.expiresAt, now)));

  return { sessionToken: token };
}

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export async function signUp(formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const data = signUpSchema.parse(rawData);

    const res = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });

    if (res.user?.id) {
      await migrateGuestToUser(res.user.id);
    }

    return { ok: true, userId: res.user?.id };
  } catch (error) {
    console.error("Error signing up:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to sign up"
    };
  }
}


const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export async function signIn(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const data = signInSchema.parse(rawData);

    const res = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
    });

    if (res.user?.id) {
      await migrateGuestToUser(res.user.id);
    }

    return { ok: true, userId: res.user?.id };
  } catch (error) {
    console.error("Error signing in:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to sign in"
    };
  }
}
export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    return session?.user ?? null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function signOut() {
  await auth.api.signOut({ headers: {} });
  return { ok: true };
}

export async function mergeGuestCartWithUserCart(userId?: string) {
  try {
    const user = userId || (await getCurrentUser())?.id;
    if (!user) {
      return { ok: false, error: "No user found" };
    }

    await migrateGuestToUser(user);
    return { ok: true };
  } catch (error) {
    console.error("Error merging guest cart:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to merge cart"
    };
  }
}

async function migrateGuestToUser(userId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("guest_session")?.value;

    if (!token) return;

    // Merge guest cart with user cart
    const result = await mergeCarts(token, userId);

    if (!result.success) {
      console.error("Failed to merge carts:", result.error);
      // Don't throw - allow user to continue even if merge fails
    }

    // Clean up guest session
    const [guestRecord] = await db
        .select()
        .from(guests)
        .where(eq(guests.sessionToken, token))
        .limit(1);

    if (guestRecord) {
      await db.delete(guests).where(eq(guests.id, guestRecord.id));
    }

    cookieStore.delete("guest_session");
  } catch (error) {
    console.error("Error migrating guest to user:", error);
    //  allow user to continue
  }
}
