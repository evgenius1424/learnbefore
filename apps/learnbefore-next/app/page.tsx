"use client";
import React, { useState } from "react";
import { Button } from "@repo/ui/components/button";

export default function Page() {
  const [count, setCount] = useState(0);

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-2">This is a Next.js application</h1>
      <p className="mb-4">
        This shadcn/ui button is shared between Next.js, Vite and any other
        application.
      </p>
      <Button onClick={() => setCount((count) => count + 1)}>
        Count is {count}
      </Button>
    </main>
  );
}
