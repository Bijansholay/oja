"use client";

import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { CreateListingForm } from "@/features/listings/create-listing-form";

export default function NewListingPage() {
  return (
    <>
      <Navbar />
      <main className="py-6">
        <CreateListingForm />
      </main>
    </>
  );
}
