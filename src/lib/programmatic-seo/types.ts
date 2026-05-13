export interface VariantParams {
  calculatorId: string;
  [key: string]: string | number;
}

export interface CalculatorVariant {
  slug: string;
  title: string;
  description: string;
  h1: string;
  content: string;
  calculatorId: string;
  params: Record<string, any>;
  meta: {
    title: string;
    description: string;
  };
  faqs: { question: string; answer: string }[];
  relatedLinks: { href: string; label: string }[];
  schema: Record<string, any>;
}

export interface VariantTemplate {
  calculatorId: string;
  calculatorSlug: string;
  calculatorName: string;
  category: string;
  templates: TemplateVariant[];
}

export interface TemplateVariant {
  slug: string;
  params: Record<string, any>;
  title: string;
  description: string;
}
