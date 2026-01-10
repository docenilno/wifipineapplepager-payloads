# Specific Loot Downloader

## Overview

The virtual Pager allows users to download their whole loot folder. Over time, more and more payloads are added to the device, which means the loot folder keeps growing.

As a user, I found it difficult to download a specific loot folder, because the current functionality only allows downloading the entire loot folder, not individual folders.

This payload introduces a new functionality that lets you download specific loot folders, making it easier to get only what you need.

## How it works

The virtual pager web application resides in the `/pineapple/ui/` folder.
Here, we have the `index.html` file of the web application.

We are going to inject a `<script>` tag that includes our custom payload.

The script retrieves the contents of the `/root/loot` folder by opening another WebSocket connection to `/api/terminal/openWs` and requesting the existing folders.

Downloading specific folders is done using the `/api/files/zip/root/loot/{FOLDER}` endpoint. 
By default, only the `/api/files/zip/root/loot/handshakes` API is exposed to the web application. However, the custom sidebar menu uses this API endpoint to download any specific loot folder you want.