"use client";

import * as React from "react";
import { toast } from "sonner";
import { useTranslation } from "@/app/i18n-provider";
import {
  Share2,
  Link,
  Code,
  ImageIcon,
  FileText,
  Check,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportAsImage, exportAsPDF, type ExportResult } from "./export-utils";

interface ShareDialogProps {
  calculatorSlug: string;
  calculatorTitle: string;
  children?: React.ReactNode;
}

const RESULTS_ELEMENT_ID = "calculator-results-panel";

export function ShareDialog({
  calculatorSlug,
  calculatorTitle,
  children,
}: ShareDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [exportingImage, setExportingImage] = React.useState(false);
  const [exportingPDF, setExportingPDF] = React.useState(false);
  const [copiedEmbed, setCopiedEmbed] = React.useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";
  const calculatorUrl = `${baseUrl}/calculators/${calculatorSlug}`;
  const embedCode = `<iframe src="${baseUrl}/api/widget/${calculatorSlug}" width="100%" height="320" frameborder="0" style="border: none; border-radius: 12px;" title="${calculatorTitle}"></iframe>`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} ${t('share.copiedToClipboard')}`);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success(`${label} ${t('share.copiedToClipboard')}`);
    }
  };


  const handleExportImage = async () => {
    setExportingImage(true);
    const result: ExportResult = await exportAsImage(
      RESULTS_ELEMENT_ID,
      calculatorSlug,
    );
    setExportingImage(false);

    if (result.success) {
      toast.success(t('share.imageDownloaded'));
    } else {
      toast.error(result.error ?? t('share.exportFailed'));
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    const result: ExportResult = await exportAsPDF(
      RESULTS_ELEMENT_ID,
      calculatorSlug,
    );
    setExportingPDF(false);

    if (result.success) {
      toast.success(t('share.pdfDownloaded'));
    } else {
      toast.error(result.error ?? t('share.exportFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <Share2 className="h-4 w-4" />
            {t('share.share')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('share.shareExport')}</DialogTitle>
          <DialogDescription>
            {t('share.shareDesc').replace('{title}', calculatorTitle)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="share" className="gap-1.5">
              <Link className="h-3.5 w-3.5" />
              {t('share.share')}
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-1.5">
              <Code className="h-3.5 w-3.5" />
              {t('share.embed')}
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              {t('share.export')}
            </TabsTrigger>
          </TabsList>

          {/* Share Link Tab */}
          <TabsContent value="share" className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="break-all text-sm text-gray-600 dark:text-gray-400">
                {calculatorUrl}
              </p>
            </div>
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={() =>
                copyToClipboard(calculatorUrl, t('share.copyLink'))
              }
            >
              <Link className="h-4 w-4" />
              {t('share.copyLink')}
            </Button>
          </TabsContent>

          {/* Embed Tab */}
          <TabsContent value="embed" className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
              <pre className="overflow-x-auto text-xs text-gray-600 dark:text-gray-400">
                <code>{embedCode}</code>
              </pre>
            </div>
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={() => {
                setCopiedEmbed(true);
                copyToClipboard(embedCode, t('share.copyEmbed'));
                setTimeout(() => setCopiedEmbed(false), 2000);
              }}
            >
              {copiedEmbed ? (
                <Check className="h-4 w-4" />
              ) : (
                <Code className="h-4 w-4" />
              )}
              {copiedEmbed ? t('share.copied') : t('share.copyEmbed')}
            </Button>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('share.exportDesc')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleExportImage}
                disabled={exportingImage}
              >
                {exportingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                {exportingImage ? t('share.exporting') : t('share.downloadPNG')}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleExportPDF}
                disabled={exportingPDF}
              >
                {exportingPDF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {exportingPDF ? t('share.exporting') : t('share.downloadPDF')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
