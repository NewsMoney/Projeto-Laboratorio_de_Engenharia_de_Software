import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ================================================== */
/* LEAFLET CONFIGURATION */
/* ================================================== */

// Corrige os ícones de marcador padrão do Leaflet em ambientes empacotados.
// Isso é necessário porque o Webpack ou outros empacotadores podem alterar os caminhos dos ícones.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Ícone de marcador personalizado para locais (places).
// Utiliza um divIcon para permitir estilos CSS complexos e animações.
const placeIcon = L.divIcon({
  className: "joinme-marker",
  html: `<div style="
    width: 32px; height: 32px;
    background: linear-gradient(135deg, #d0dd1f, #14b8a6);
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
  "><div style="
    width: 10px; height: 10px;
    background: #fff;
    border-radius: 50%;
    transform: rotate(45deg);
  "></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Ícone de marcador para a localização do usuário.
// Um círculo azul simples para indicar a posição atual do usuário.
const userIcon = L.divIcon({
  className: "joinme-user-marker",
  html: `<div style="
    width: 16px; height: 16px;
    background: #3b82f6;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/* ================================================== */
/* INTERFACES */
/* ================================================== */

/**
 * @interface MapPlace
 * @description Define a estrutura de dados para um local a ser exibido no mapa.
 * @property {number} id - Identificador único do local.
 * @property {string} name - Nome do local.
 * @property {string | number} lat - Latitude do local.
 * @property {string | number} lng - Longitude do local.
 * @property {string | null} [category] - Categoria opcional do local.
 * @property {string} [address] - Endereço opcional do local.
 */
export interface MapPlace {
  id: number;
  name: string;
  lat: string | number;
  lng: string | number;
  category?: string | null;
  address?: string;
}

/**
 * @interface LeafletMapProps
 * @description Propriedades aceitas pelo componente LeafletMap.
 * @property {MapPlace[]} [places] - Uma lista de locais a serem exibidos no mapa.
 * @property {[number, number]} [center] - Coordenadas centrais do mapa [latitude, longitude].
 * @property {number} [zoom] - Nível de zoom inicial do mapa. Padrão é 13.
 * @property {(place: MapPlace) => void} [onPlaceClick] - Função de callback chamada ao clicar em um marcador de local.
 * @property {boolean} [showUserLocation] - Se deve exibir a localização atual do usuário. Padrão é true.
 * @property {string} [className] - Classes CSS adicionais para o contêiner do mapa.
 * @property {React.CSSProperties} [style] - Estilos CSS inline adicionais para o contêiner do mapa.
 */
interface LeafletMapProps {
  places?: MapPlace[];
  center?: [number, number];
  zoom?: number;
  onPlaceClick?: (place: MapPlace) => void;
  showUserLocation?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/* ================================================== */
/* LEAFLET MAP COMPONENT */
/* ================================================== */

/**
 * @function LeafletMap
 * @description Um componente React que renderiza um mapa interativo usando a biblioteca Leaflet.
 *              Ele exibe marcadores para locais fornecidos e, opcionalmente, a localização do usuário.
 * @param {LeafletMapProps} props - As propriedades para configurar o mapa.
 * @returns {JSX.Element} O elemento JSX que representa o mapa Leaflet.
 */
export default function LeafletMap({
  places = [],
  center,
  zoom = 13,
  onPlaceClick,
  showUserLocation = true,
  className = "",
  style,
}: LeafletMapProps) {
  // Referência para o elemento DOM do mapa.
  const mapRef = useRef<HTMLDivElement>(null);
  // Referência para a instância do objeto de mapa Leaflet.
  const mapInstanceRef = useRef<L.Map | null>(null);
  // Referência para o grupo de camadas de marcadores de locais.
  const markersRef = useRef<L.LayerGroup | null>(null);
  // Referência para o marcador de localização do usuário.
  const userMarkerRef = useRef<L.Marker | null>(null);
  // Estado para armazenar a localização atual do usuário.
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  /**
   * @description Hook useEffect para inicializar o mapa Leaflet.
   *              Executa apenas uma vez após a montagem inicial do componente.
   */
  useEffect(() => {
    // Se o elemento DOM do mapa não estiver disponível ou o mapa já estiver inicializado, retorna.
    if (!mapRef.current || mapInstanceRef.current) return;

    // Define o centro padrão do mapa para São Paulo se nenhum centro for fornecido.
    const defaultCenter: [number, number] = center || [-23.5505, -46.6333]; // São Paulo

    // Inicializa a instância do mapa Leaflet com configurações de performance e suavidade.
    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom,
      minZoom: 4,
      maxZoom: 19,
      zoomControl: false, // Desabilita o controle de zoom padrão.
      attributionControl: false, // Desabilita o controle de atribuição padrão.
      
      // CONFIGURAÇÕES DE PERFORMANCE EXTREMA
      preferCanvas: true, // Prefere renderização via Canvas para melhor performance.
      zoomAnimation: true,
      fadeAnimation: false, // Animação de fade desabilitada para aparência instantânea.
      markerZoomAnimation: true,
      
      // SUAVIZAÇÃO
      worldCopyJump: true,
      maxBoundsViscosity: 0.2, // Viscosidade de limites muito solta para rolagem suave.
      
      // INÉRCIA (ajustada para velocidade)
      inertia: true,
      inertiaDeceleration: 4000,
      inertiaMaxSpeed: 2000,
      easeLinearity: 0.1,
    });

    // ESTRATÉGIA DE CARREGAMENTO DE TILES EXTREMA
    // Configura a camada de tiles usando o tema 'dark_all' do CartoDB.
    const tileLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        minZoom: 4,
        subdomains: "abcd",
        
        // PRÉ-CARREGAMENTO E BUFFERING
        updateWhenIdle: false,      // Carrega tiles enquanto o mapa está em movimento.
        updateWhenZooming: true,    // Carrega tiles enquanto o mapa está sendo ampliado/reduzido.
        updateInterval: 50,         // Intervalo de atualização ultra-rápido (50ms).
        
        // OVER-RENDERING
        // keepBuffer: número de linhas/colunas de tiles para manter ao redor da visualização.
        keepBuffer: 32,             // Buffer massivo (o padrão é 2) para pré-carregar mais tiles.
        
        // bounds: restringe ao mundo, mas garante que esteja ativo.
        noWrap: false,
        
        // Performance
        className: 'high-perf-tiles',
      }
    ).addTo(map);

    // HACK AVANÇADO: Aumenta a área de "Prerender".
    // Sobrescreve o método interno _getTiledPixelBounds para forçar o Leaflet a considerar a tela muito maior.
    const gridLayer = tileLayer as any;
    const originalGetTiledPixelBounds = gridLayer._getTiledPixelBounds;
    
    gridLayer._getTiledPixelBounds = function(center: L.LatLng) {
        const pixelBounds = originalGetTiledPixelBounds.call(this, center);
        // Expande os limites de pixel em 1000 pixels em todas as direções.
        // Isso força o Leaflet a carregar tiles muito além da borda visível.
        pixelBounds.min = pixelBounds.min.subtract([1000, 1000]);
        pixelBounds.max = pixelBounds.max.add([1000, 1000]);
        return pixelBounds;
    };

    // Inicializa o grupo de camadas para marcadores e o adiciona ao mapa.
    markersRef.current = L.layerGroup().addTo(map);
    // Armazena a instância do mapa na referência.
    mapInstanceRef.current = map;

    // Força uma atualização do tamanho do mapa após um pequeno atraso para garantir renderização correta.
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    // Função de limpeza: remove o mapa quando o componente é desmontado.
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Array de dependências vazio garante que este efeito execute apenas uma vez.

  /**
   * @description Hook useEffect para atualizar o centro e o zoom do mapa quando as propriedades `center` ou `zoom` mudam.
   */
  useEffect(() => {
    // Se a instância do mapa não estiver disponível ou o centro não for fornecido, retorna.
    if (mapInstanceRef.current && center) {
      const currentCenter = mapInstanceRef.current.getCenter();
      const currentZoom = mapInstanceRef.current.getZoom();
      
      // Verifica se o novo centro ou zoom é significativamente diferente do atual.
      const isDifferent = 
        Math.abs(currentCenter.lat - center[0]) > 0.0001 || 
        Math.abs(currentCenter.lng - center[1]) > 0.0001 ||
        currentZoom !== zoom;

      // Se for diferente, atualiza a visualização do mapa com animação.
      if (isDifferent) {
        mapInstanceRef.current.setView(center, zoom, { animate: true, duration: 0.3 });
      }
    }
  }, [center, zoom]); // Dependências: `center` e `zoom`.

  /**
   * @description Hook useEffect para obter a localização atual do usuário.
   *              Executa quando `showUserLocation` muda.
   */
  useEffect(() => {
    // Se a exibição da localização do usuário não estiver ativada, retorna.
    if (!showUserLocation) return;

    // Solicita a localização geográfica do usuário.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc); // Atualiza o estado com a localização do usuário.

        // Se o mapa estiver inicializado e nenhum centro inicial foi definido, centraliza o mapa na localização do usuário.
        if (mapInstanceRef.current && !center) {
          mapInstanceRef.current.setView(loc, zoom, { animate: true });
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 } // Opções para alta precisão e timeout.
    );
  }, [showUserLocation]); // Dependência: `showUserLocation`.

  /**
   * @description Hook useEffect para exibir ou atualizar o marcador da localização do usuário no mapa.
   *              Executa quando `userLocation` muda.
   */
  useEffect(() => {
    // Se a instância do mapa ou a localização do usuário não estiverem disponíveis, retorna.
    if (!mapInstanceRef.current || !userLocation) return;

    // Se o marcador do usuário já existe, atualiza sua posição.
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
    } else {
      // Caso contrário, cria um novo marcador para o usuário e o adiciona ao mapa.
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon })
        .bindPopup(
          '<div style="color:#1e293b;font-weight:600;font-size:13px;">Você está aqui</div>'
        )
        .addTo(mapInstanceRef.current);
    }
  }, [userLocation]); // Dependência: `userLocation`.

  /**
   * @description Hook useEffect para atualizar os marcadores de locais no mapa.
   *              Executa quando a lista de `places` ou a função `onPlaceClick` mudam.
   */
  useEffect(() => {
    // Se o grupo de marcadores ou a instância do mapa não estiverem disponíveis, retorna.
    if (!markersRef.current || !mapInstanceRef.current) return;

    // Limpa todos os marcadores existentes antes de adicionar os novos.
    markersRef.current.clearLayers();

    // Itera sobre cada local e adiciona um marcador ao mapa.
    places.forEach((place) => {
      // Converte latitude e longitude para números, se forem strings.
      const lat = typeof place.lat === "string" ? parseFloat(place.lat) : place.lat;
      const lng = typeof place.lng === "string" ? parseFloat(place.lng) : place.lng;

      // Se as coordenadas forem inválidas, pula este local.
      if (isNaN(lat) || isNaN(lng)) return;

      // Cria um novo marcador com o ícone personalizado de local.
      const marker = L.marker([lat, lng], { icon: placeIcon });

      // Conteúdo HTML para o popup do marcador.
      const popupContent = `
        <div style="min-width:160px;padding:4px 0;">
          <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:4px;">${place.name}</div>
          ${place.category ? `<div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${place.category}</div>` : ""}
          ${place.address ? `<div style="font-size:12px;color:#475569;">${place.address}</div>` : ""}
        </div>
      `;

      // Vincula o popup ao marcador com estilos personalizados.
      marker.bindPopup(popupContent, {
        closeButton: false,
        className: "joinme-popup",
      });

      // Adiciona um listener de clique se a função onPlaceClick for fornecida.
      if (onPlaceClick) {
        marker.on("click", () => onPlaceClick(place));
      }

      // Adiciona o marcador ao grupo de camadas de marcadores.
      markersRef.current!.addLayer(marker);
    });

    // Ajusta os limites do mapa para incluir todos os locais e a localização do usuário (se houver).
    if (places.length > 0) {
      // Filtra locais válidos para calcular os limites.
      const validPlaces = places
        .map((p) => {
          const lat = typeof p.lat === "string" ? parseFloat(p.lat) : p.lat;
          const lng = typeof p.lng === "string" ? parseFloat(p.lng) : p.lng;
          return isNaN(lat) || isNaN(lng) ? null : ([lat, lng] as [number, number]);
        })
        .filter((p): p is [number, number] => p !== null);

      if (validPlaces.length > 0) {
        // Cria um objeto LatLngBounds a partir dos locais válidos.
        const bounds = L.latLngBounds(validPlaces);
        // Estende os limites para incluir a localização do usuário, se disponível.
        if (userLocation) bounds.extend(userLocation);
        
        const map = mapInstanceRef.current;
        // Ajusta a visualização do mapa para se adequar aos limites com animação.
        setTimeout(() => {
          if (map) {
            map.fitBounds(bounds, { 
              padding: [50, 50], 
              maxZoom: 15, 
              animate: true,
              duration: 0.5 
            });
          }
        }, 100);
      }
    }
  }, [places, onPlaceClick]); // Dependências: `places` e `onPlaceClick`.

  // Renderiza o contêiner do mapa.
  return (
    <div
      ref={mapRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "300px",
        borderRadius: "inherit",
        backgroundColor: "#0e0e0e",
        overflow: "hidden", // Crucial para o over-rendering de tiles.
        ...style,
      }}
    />
  );
}
