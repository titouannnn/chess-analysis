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

    getLineGraph(nativeElement: any, data_o: any, data_label: string, labels_o: any, p0: { responsive: boolean; maintainAspectRatio: boolean; scales: { x: { grid: { display: boolean; }; }; }; }) : any{
        
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

    getSimpleBarChart(nativeElement: any, data_o: any, label_data: string, labels_o: any, p0: { responsive: boolean; maintainAspectRatio: boolean; scales: { x: { grid: { display: boolean; }; }; }; }) : any {

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

}