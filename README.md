# reedsy-api
Backend API + more for Reedsy Node.js Fullstack Engineer Challenge
Written in Typescript

1. Document Versioning (src/versioning.ts) - Support versions of different documents, storing them in an accessible in-memory document-versions map. It creates a diff between each version using the Google Doc diff-match-patch format/algorithm (reconstructing through iteration of all versions in order to read). This is then further optimised by the use of zlib compressions on the diffs which are stored as Buffers.
2. Node.js API (src/server.ts) - Uses classes for both ImportJob and ExportJob, enforcing alllowed filetypes (using enums for conditional comparison) at runtime in order to serve errors where appropriate in REST API calls. This API is complete according to the specifications with some additions such as /export/:id which allows accessing specific ExportJobs for example.
3. Operations (src/operations.ts) - Supports application of operational transformation for any length of operation sequences in any order. It also supports the combining of these sequences. e.g [Move, Insert, Delete] and [Move, Delete, Insert, Move, Delete] becomes [Move, Insert, Delete, Move, Delete, Insert, Move, Delete].
