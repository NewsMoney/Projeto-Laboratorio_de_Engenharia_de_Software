/**
 * @file App.tsx
 * @description Componente raiz da aplicação React.
 * Configura o roteamento (wouter), provedores de contexto (tema, tooltips)
 * e define a estrutura principal do layout.
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppLayout } from "./components/AppLayout";

/* Importação das páginas */
import Home from "./pages/Home";
import Search from "./pages/Search";
import MapPage from "./pages/MapPage";
import Details from "./pages/Details";
import CheckIn from "./pages/CheckIn";
import Ranking from "./pages/Ranking";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import register from "./pages/Register";
import AdminPage from "./pages/AdminPage"
import ReportsPage from "./pages/ReportsPage"
import CreatePartyOrPlace from "./pages/CreateParty";
import Usuarios from "./pages/UsersInfo";

/**
 * @component Router
 * @description Define as rotas da aplicação e renderiza a página correspondente
 * dentro do layout principal (AppLayout).
 */
function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={Search} />
        <Route path="/map" component={MapPage} />
        <Route path="/details/:id" component={Details} />
        <Route path="/checkin/:id" component={CheckIn} />
        <Route path="/checkin" component={CheckIn} />
        <Route path="/ranking" component={Ranking} />
        <Route path="/profile" component={Profile} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={register} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/create-party" component={CreatePartyOrPlace} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/users-info" component={Usuarios} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

/**
 * @component App
 * @description Ponto de entrada principal. Envolve a aplicação com os provedores
 * necessários (ErrorBoundary, ThemeProvider, TooltipProvider) e renderiza o Router.
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
