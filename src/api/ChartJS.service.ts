import { Injectable } from "@angular/core";
import { Chart } from "chart.js/auto";


@Injectable({
  providedIn: 'root'
})
export class ChartJS {

    getDoughnutGraph( nativeElement : any,  data_o: any, labels_o: any ) : any{
      
      return new Chart(
            nativeElement,
            {
              type: 'doughnut',
              data: {
                labels: labels_o,
                datasets: [
                  {
                    data: data_o
                  }
                ]
              }
            }
          );

    }

    getLineGraph( nativeElement : any,  data_o: any, data_label : string, labels_o: any ) : any{
        
        return new Chart(
            nativeElement,
            {
              type: 'line',
              data: {
                labels: labels_o,
                datasets: [
                  {
                    label: data_label,
                    data: data_o
                  }
                ]
              }
            }
          );

    }

    getSimpleBarChart( nativeElement : any,  data_o: any, label_data : string, labels_o: any ) : any {

        return new Chart(
            nativeElement,
            {
              type: 'bar',
              data: {
                labels: labels_o,
                datasets: [
                  {
                    label: label_data,
                    data: data_o
                  }
                ]
              }
            }
          );
    }

    getStackedBarChart(nativeElement: any, labels_data : any, datasets_data : any) : Chart{

      return new Chart(
        nativeElement,
        {
          type: 'bar',
          data: {
            labels: labels_data,
            datasets: datasets_data
          },
          options: {
            responsive: true,
            scales: {
              x: {
                stacked: true,
              },
              y: {
                stacked: true
              }
            }
          } 
          
        }
      );

    }

    // Cette fonction va étendre le graphique avec des options avancées
      extendChartOptions(chart: any, options: any): void {
        if (!chart || !chart.options) return;
        
        // Appliquer des animations
        chart.options.animation = {
          duration: 800,
          easing: 'easeOutCubic'
        };
        
        // Appliquer d'autres options
        if (options.colors) {
          if (Array.isArray(options.colors)) {
            // Pour les camemberts avec des couleurs différentes par segment
            const backgroundColors = options.colors.map((color: any) => color.backgroundColor);
            chart.data.datasets[0].backgroundColor = backgroundColors;
          } else {
            // Pour les autres types de graphiques
            for (const key in options.colors) {
              if (options.colors.hasOwnProperty(key)) {
                chart.data.datasets[0][key] = options.colors[key];
              }
            }
          }
        }
        
        if (options.plugins) {
          chart.options.plugins = {
            ...chart.options.plugins,
            ...options.plugins
          };
        }
        
        // Mettre à jour le graphique
        chart.update();
      }

}