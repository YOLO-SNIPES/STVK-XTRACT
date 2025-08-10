import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface MainMenuProps {
  onInstallPWA: () => void;
  showInstall: boolean;
}

export default function MainMenu({ onInstallPWA, showInstall }: MainMenuProps) {
  const [, setLocation] = useLocation();

  const navigate = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="flex justify-center flex-wrap gap-2 mt-4">
      <Button onClick={() => navigate("/")} className="cyber-button font-mono text-sm">[MAIN]</Button>
      <Button onClick={() => navigate("/guide")} className="cyber-button font-mono text-sm">[GUIDE]</Button>
      <Button onClick={() => navigate("/faq")} className="cyber-button font-mono text-sm">[FAQ]</Button>
      <Button onClick={() => navigate("/privacy")} className="cyber-button font-mono text-sm">[PRIVACY]</Button>
      <Button onClick={() => navigate("/terms")} className="cyber-button font-mono text-sm">[TERMS]</Button>
      <Button onClick={() => navigate("/disclaimer")} className="cyber-button font-mono text-sm">[DISCLAIMER]</Button>
      {showInstall && (
        <Button onClick={onInstallPWA} className="cyber-button font-mono text-sm bg-secondary text-black hover:bg-green-400">[INSTALL_APP]</Button>
      )}
    </div>
  );
}
