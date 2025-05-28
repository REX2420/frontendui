import { Metadata } from "next";
import BlogPostClient from "./BlogPostClient";

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/blogs/${params.slug}`);
    const data = await response.json();

    if (data.success && data.blog) {
      const blog = data.blog;
      return {
        title: blog.seoTitle || blog.title,
        description: blog.seoDescription || blog.excerpt,
        keywords: blog.tags?.join(', '),
        openGraph: {
          title: blog.title,
          description: blog.excerpt,
          images: [blog.featuredImage],
          type: 'article',
          publishedTime: blog.publishedAt,
          authors: [blog.authorName],
        },
        twitter: {
          card: 'summary_large_image',
          title: blog.title,
          description: blog.excerpt,
          images: [blog.featuredImage],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: 'Blog Post - VibeCart',
    description: 'Read our latest blog post about fragrances and lifestyle.',
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogPostClient slug={params.slug} />;
} 