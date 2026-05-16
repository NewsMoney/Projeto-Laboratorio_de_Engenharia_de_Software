import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

/* ================================================== */
/* INTERFACES */
/* ================================================== */

/**
 * @interface LoginDialogProps
 * @description Propriedades aceitas pelo componente LoginDialog.
 * @property {string} [title] - Título a ser exibido no diálogo de login.
 * @property {string} [logo] - URL ou caminho para a imagem do logo a ser exibida.
 * @property {boolean} [open] - Controla a visibilidade do diálogo. Se `true`, o diálogo é aberto.
 * @property {() => void} onLogin - Função de callback chamada quando o botão de login é clicado.
 * @property {(open: boolean) => void} [onOpenChange] - Função de callback para controlar o estado de abertura/fechamento do diálogo externamente.
 * @property {() => void} [onClose] - Função de callback chamada quando o diálogo é fechado.
 */
interface LoginDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

/* ================================================== */
/* COMPONENTE LOGIN DIALOG */
/* ================================================== */

/**
 * @function LoginDialog
 * @description Componente de diálogo de login que exibe um título, um logo opcional e um botão para iniciar o processo de login.
 *              Pode ser controlado externamente ou internamente.
 * @param {LoginDialogProps} props - As propriedades para configurar o diálogo de login.
 */
export function LoginDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: LoginDialogProps) {
  // Estado interno para controlar a abertura/fechamento do diálogo, usado se `onOpenChange` não for fornecido.
  const [internalOpen, setInternalOpen] = useState(open);

  /**
   * @description Hook useEffect para sincronizar o estado interno `internalOpen` com a prop `open`.
   *              Isso garante que o diálogo reaja a mudanças na prop `open` quando não há controle externo.
   */
  useEffect(() => {
    // Se `onOpenChange` for fornecido, o controle é externo, então não atualiza o estado interno.
    if (!onOpenChange) {
      setInternalOpen(open);
    }
  }, [open, onOpenChange]); // Dependências: `open` e `onOpenChange`.

  /**
   * @description Função para lidar com a mudança de estado de abertura/fechamento do diálogo.
   *              Chama `onOpenChange` se fornecido, ou atualiza o estado interno `internalOpen`.
   *              Também chama `onClose` quando o diálogo é fechado.
   * @param {boolean} nextOpen - O próximo estado de abertura do diálogo (true para abrir, false para fechar).
   */
  const handleOpenChange = (nextOpen: boolean) => {
    // Se `onOpenChange` for fornecido, delega o controle ao componente pai.
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      // Caso contrário, atualiza o estado interno.
      setInternalOpen(nextOpen);
    }

    // Se o diálogo estiver sendo fechado, chama a função `onClose` se ela existir.
    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog
      // Controla a abertura do diálogo: usa a prop `open` se `onOpenChange` for fornecido (controle externo),
      // caso contrário, usa o estado interno `internalOpen`.
      open={onOpenChange ? open : internalOpen}
      // Gerencia as mudanças de estado de abertura/fechamento.
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="py-5 bg-card rounded-[20px] w-[400px] shadow-lg border border-border backdrop-blur-2xl p-0 gap-0 text-center"> {/* Estilos para o conteúdo do diálogo */}
        <div className="flex flex-col items-center gap-2 p-5 pt-12"> {/* Contêiner para logo, título e descrição */}
          {logo ? ( // Renderiza o logo se a prop `logo` for fornecida.
            <div className="w-16 h-16 bg-muted rounded-xl border border-border flex items-center justify-center"> {/* Estilos do contêiner do logo */}
              <img
                src={logo}
                alt="Logo"
                className="w-10 h-10 rounded-md" // Estilos da imagem do logo.
              />
            </div>
          ) : null}

          {title ? ( // Renderiza o título se a prop `title` for fornecida.
            <DialogTitle className="text-xl font-semibold text-foreground leading-[26px] tracking-[-0.44px]"> {/* Estilos do título */}
              {title}
            </DialogTitle>
          ) : null}
          <DialogDescription className="text-sm text-muted-foreground leading-5 tracking-[-0.154px]"> {/* Estilos da descrição */}
            Faça login para continuar
          </DialogDescription>
        </div>

        <DialogFooter className="px-5 py-5"> {/* Rodapé do diálogo, contendo o botão de login */}
          <Button
            onClick={onLogin} // Chama a função `onLogin` quando o botão é clicado.
            className="w-full h-10 rounded-[10px] text-sm font-medium leading-5 tracking-[-0.154px]" // Estilos do botão de login.
          >
            Entrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
