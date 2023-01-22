import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function Navbar() {
  const [showButton, setShowButton] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("test");
      setDeferredPrompt(e);
      console.log(deferredPrompt);
      setShowButton(true);
    });
  }

  async function onClickInstall() {
    if (deferredPrompt !== null) {
      console.log("clicked");
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(outcome);
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  }

  return (
    <div className="flex w-full justify-end mb-8 lg:px-16 px-8">
      {showButton && (
        <button
          onClick={onClickInstall}
          id="install-btn-component"
          className="flex flex-row space-x-4 justify-center items-center sm:text-lg text-md"
        >
          <p className="text-black dark:text-white">Install</p>
          <div className="text-red-600">
            <FontAwesomeIcon icon={faDownload} />
          </div>
        </button>
      )}
    </div>
  );
}
