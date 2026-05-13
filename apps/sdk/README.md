# AcadéPost NodeJS SDK

This is the NodeJS SDK for AcadéPost.

You can start by installing the package:

```bash
npm install @acadepost/node
```

## Usage
```typescript
import AcadePost from '@acadepost/node';
const acadepost = new AcadePost('your api key', 'your self-hosted instance (optional)');
```

The available methods are:
- `post(posts: CreatePostDto)` - Schedule a post to AcadéPost
- `postList(filters: GetPostsDto)` - Get a list of posts
- `upload(file: Buffer, extension: string)` - Upload a file to AcadéPost
- `integrations()` - Get a list of connected channels
- `deletePost(id: string)` - Delete a post by ID

Alternatively, you can use the SDK with curl against your AcadéPost API endpoint.
