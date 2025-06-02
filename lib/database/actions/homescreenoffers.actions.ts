"use  server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import HomeScreenOffer from "../models/home.screen.offers";
import { unstable_cache } from "next/cache";

// This file previously contained functions for special combos and crazy deals
// Those sections have been removed from the application
