import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

/* ================================================== */
/* INTERFACES */
/* ================================================== */

/**
 * @interface Props
 * @description Define as propriedades aceitas pelo componente ErrorBoundary.
 * @property {ReactNode} children - Os elementos filhos que o ErrorBoundary irá envolver e proteger.
 */
interface Props {
  children: ReactNode;
}

/**
 * @interface State
 * @description Define o estado interno do componente ErrorBoundary.
 * @property {boolean} hasError - Indica se um erro foi capturado (true) ou não (false).
 * @property {Error | null} error - O objeto de erro capturado, ou `null` se nenhum erro ocorreu.
 */
interface State {
  hasError: boolean;
  error: Error | null;
}

/* ================================================== */
/* COMPONENTE ERROR BOUNDARY */
/* ================================================== */

/**
 * @class ErrorBoundary
 * @extends Component<Props, State>
 * @description Um componente React que captura erros JavaScript em qualquer lugar de sua árvore de componentes filhos,
 *              registra esses erros e exibe uma UI de fallback em vez da árvore de componentes que falhou.
 *              Isso previne que toda a aplicação trave devido a um erro em um subcomponente.
 */
class ErrorBoundary extends Component<Props, State> {
  /**
   * @constructor
   * @description Inicializa o estado do componente.
   * @param {Props} props - As propriedades passadas para o componente.
   */
  constructor(props: Props) {
    super(props);
    // O estado inicial indica que nenhum erro foi capturado.
    this.state = { hasError: false, error: null };
  }

  /**
   * @static
   * @method getDerivedStateFromError
   * @description Este método de ciclo de vida é invocado após um erro ser lançado por um componente descendente.
   *              Ele retorna um objeto para atualizar o estado, indicando que um erro ocorreu.
   * @param {Error} error - O erro que foi lançado.
   * @returns {State} Um objeto de estado que será mesclado com o estado atual do componente.
   */
  static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para indicar que um erro foi capturado e armazena o objeto de erro.
    return { hasError: true, error };
  }

  /**
   * @method render
   * @description Renderiza a UI do componente.
   * @returns {ReactNode} A UI de fallback se um erro foi capturado, ou os filhos normais caso contrário.
   */
  render() {
    // Se um erro foi capturado, exibe a UI de fallback.
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background"> {/* Contêiner principal para centralizar o conteúdo de erro */}
          <div className="flex flex-col items-center w-full max-w-2xl p-8"> {/* Contêiner interno para o conteúdo de erro */}
            <AlertTriangle
              size={48} // Tamanho do ícone de alerta.
              className="text-destructive mb-6 flex-shrink-0" // Estilos para o ícone de alerta.
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2> {/* Título da mensagem de erro */}

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6"> {/* Contêiner para exibir o stack trace do erro */}
              <pre className="text-sm text-muted-foreground whitespace-break-spaces"> {/* Estilos para o stack trace */}
                {this.state.error?.stack} {/* Exibe o stack trace do erro, se disponível */}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()} // Recarrega a página ao clicar no botão.
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg", // Estilos base do botão.
                "bg-primary text-primary-foreground", // Cores de fundo e texto do botão.
                "hover:opacity-90 cursor-pointer" // Efeito de hover e cursor.
              )}
            >
              <RotateCcw size={16} /> {/* Ícone de recarregar */}
              Reload Page {/* Texto do botão */}
            </button>
          </div>
        </div>
      );
    }

    // Se nenhum erro foi capturado, renderiza os componentes filhos normalmente.
    return this.props.children;
  }
}

export default ErrorBoundary;
