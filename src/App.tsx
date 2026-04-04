import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DiscoverPage from "./pages/DiscoverPage";
import FollowingPage from "./pages/FollowingPage";
import ProfilePage from "./pages/ProfilePage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import AddSourcePage from "./pages/AddSourcePage";
import HelpPage from "./pages/HelpPage";
import SettingsPage from "./pages/SettingsPage";
import TwitterCardExample from "./pages/TwitterCardExample";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/following" element={<FollowingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/article/:id" element={<ArticleDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/add-source" element={<AddSourcePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/twitter-card-example" element={<TwitterCardExample />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
