#!/usr/bin/env node
// Run: node scripts/generate-vapid.mjs
// Generates VAPID key pair for Web Push notifications

import webpush from "web-push"

const keys = webpush.generateVAPIDKeys()

console.log("Add these to your .env.local:\n")
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
