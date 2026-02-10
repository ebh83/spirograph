# Virtual Spirograph

An interactive spirograph simulator built with Next.js and React. Create mesmerizing geometric patterns just like the classic drawing toy!

## Features

- **Auto Mode**: Watch patterns draw automatically with adjustable speed
- **Mouse Mode**: Click and drag to control the inner gear manually
- **Preset Patterns**: Quick-start with 6 built-in pattern configurations
- **Customizable**: Adjust outer gear, inner gear, and pen distance
- **Color Options**: 15 preset pen colors plus custom color picker
- **Background Colors**: Multiple background options
- **Save Your Art**: Download your creations as PNG images
- **Touch Support**: Works on mobile and tablet devices

## Getting Started

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Vercel

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

That's it! Vercel will automatically detect it's a Next.js project and configure everything.

## How It Works

The spirograph uses the mathematical equations for a hypotrochoid curve:

```
x = (R - r) * cos(t) + d * cos((R - r) / r * t)
y = (R - r) * sin(t) - d * sin((R - r) / r * t)
```

Where:
- **R** = Outer gear radius
- **r** = Inner gear radius  
- **d** = Pen distance from inner gear center
- **t** = Rotation angle

## License

MIT
