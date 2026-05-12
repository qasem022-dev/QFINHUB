"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Moon,
  Sun,
  Globe,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Monitor,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/app/i18n-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { localeLabels, type Locale } from "@/lib/i18n";

type Theme = "light" | "dark" | "system";

const supabase = createClient();

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [user, setUser] = React.useState<{
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  } | null>(null);
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { user_metadata } = session.user;
          const displayName =
            user_metadata?.full_name ?? user_metadata?.name ?? "";
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            name: displayName || undefined,
            avatar_url: user_metadata?.avatar_url ?? undefined,
          });
          setName(displayName);
        } else {
          // No session — show a prompt to sign in
          setUser(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load user data",
        );
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleSaveProfile = React.useCallback(async () => {
    if (!user) return;
    try {
      setSaving(true);
      setSaveSuccess(false);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: name },
      });

      if (updateError) throw updateError;

      setUser((prev) => (prev ? { ...prev, name } : prev));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [user, name]);

  const handleDeleteAccount = React.useCallback(async () => {
    if (!user || deleting) return;
    setDeleting(true);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      setDeleteOpen(false);
      toast.success("Account deleted successfully. Goodbye!");
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete account";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }, [user, deleting, router]);

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t("dashboard.light"), icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: t("dashboard.dark"), icon: <Moon className="h-4 w-4" /> },
    {
      value: "system",
      label: t("dashboard.system"),
      icon: <Monitor className="h-4 w-4" />,
    },
  ];

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6 animate-fade-in">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Profile section skeleton */}
        <div className="h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />

        {/* Appearance section skeleton */}
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />

        {/* Language section skeleton */}
        <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("dashboard.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("dashboard.signInRequired")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.signInRequiredDesc")}
            </p>
          </div>
          <Button asChild>
            <Link href="/auth/login">{t("dashboard.signIn")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t("dashboard.settings")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("dashboard.settingsDesc")}
        </p>
      </div>

      {/* Profile Section */}
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary-600" />
            {t("dashboard.profile")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.profileDesc")}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user.avatar_url ?? undefined}
                alt={user.name ?? user.email}
              />
              <AvatarFallback className="bg-primary-100 text-lg font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.name || "User"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t("dashboard.fullName")}
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("dashboard.namePlaceholder")}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t("dashboard.email")}
              </label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-gray-50 dark:bg-gray-800/50"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("dashboard.emailNotChangeable")}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSaveProfile} disabled={saving} className="transition-all hover:shadow-sm">
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    {t("dashboard.saving")}
                  </>
                ) : (
                  t("dashboard.saveChanges")
                )}
              </Button>
              {saveSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("dashboard.savedSuccess")}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            {t("dashboard.appearance")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.appearanceDesc")}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("dashboard.theme")}
            </label>
            <div className="flex flex-wrap gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={[
                    "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    theme === option.value
                      ? "border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-surface-dark dark:text-gray-400 dark:hover:bg-gray-800",
                  ].join(" ")}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            {t("dashboard.language")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.languageDesc")}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <Select
            value={locale}
            onValueChange={(value: Locale) => setLocale(value)}
          >
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder={t("dashboard.selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{localeLabels.en}</SelectItem>
              <SelectItem value="es">{localeLabels.es}</SelectItem>
              <SelectItem value="hi">{localeLabels.hi}</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {locale === "en" ? "Additional languages coming soon" : locale === "es" ? "Más idiomas próximamente" : "अतिरिक्त भाषाएँ जल्द आ रही हैं"}
          </p>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {t("dashboard.account")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.accountDesc")}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t("dashboard.deleteAccount")}
              </p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {t("dashboard.deleteAccountDesc")}
              </p>
            </div>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  {t("dashboard.deleteAccount")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-red-600 dark:text-red-400">
                    {t("dashboard.deleteAccountTitle")}
                  </DialogTitle>
                  <DialogDescription className="space-y-3 pt-2">
                    <p>
                      {t("dashboard.deleteConfirm")}
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      <li>{t("dashboard.deleteConfirmList.0")}</li>
                      <li>{t("dashboard.deleteConfirmList.1")}</li>
                      <li>{t("dashboard.deleteConfirmList.2")}</li>
                      <li>{t("dashboard.deleteConfirmList.3")}</li>
                    </ul>
                    <p className="pt-1 font-medium">
                      {t("dashboard.deleteConfirmPrompt")}
                    </p>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    disabled={deleting}
                  >
                    {t("dashboard.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        {t("dashboard.deleting")}
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        {t("dashboard.yesDelete")}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
