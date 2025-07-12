import { Button } from "@/components/ui/button";

interface NavigationTabsProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onInstallPWA: () => void;
  showInstall: boolean;
}

export default function NavigationTabs({ 
  activeSection, 
  setActiveSection, 
  onInstallPWA, 
  showInstall 
}: NavigationTabsProps) {
  const tabs = [
    { id: "main", label: "[MAIN]", variant: "cyber" },
    { id: "guide", label: "[GUIDE]", variant: "cyan" },
    { id: "faq", label: "[FAQ]", variant: "secondary" },
    { id: "privacy", label: "[PRIVACY]", variant: "accent" },
    { id: "terms", label: "[TERMS]", variant: "purple" },
    { id: "disclaimer", label: "[DISCLAIMER]", variant: "destructive" },
  ];

  return (
    <div className="flex justify-center flex-wrap gap-2 mt-6">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          onClick={() => setActiveSection(tab.id)}
          className={`px-4 py-2 rounded text-sm font-mono transition-colors ${
            activeSection === tab.id 
              ? "cyber-button text-white" 
              : getTabVariantClasses(tab.variant)
          }`}
        >
          {tab.label}
        </Button>
      ))}
      {showInstall && (
        <Button
          onClick={onInstallPWA}
          className="bg-gradient-to-r from-[hsl(251,91%,64%)] to-[hsl(188,94%,43%)] hover:shadow-lg text-white px-4 py-2 rounded text-sm font-mono transition-all"
        >
          [INSTALL]
        </Button>
      )}
    </div>
  );
}

function getTabVariantClasses(variant: string): string {
  const variants = {
    cyan: "bg-[hsl(188,94%,43%)] hover:bg-cyan-400 text-white",
    secondary: "bg-[hsl(141,100%,59%)] hover:bg-green-400 text-black",
    accent: "bg-[hsl(24,100%,50%)] hover:bg-orange-400 text-black",
    purple: "bg-[hsl(251,91%,64%)] hover:bg-purple-400 text-white",
    destructive: "bg-red-500 hover:bg-red-400 text-white",
  };
  return variants[variant as keyof typeof variants] || "bg-gray-600 hover:bg-gray-500 text-white";
}
