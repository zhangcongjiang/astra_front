<template>
  <div class="chart-container">
    <canvas ref="chart"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

export default {
  props: {
    data: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const chart = ref(null);
    let chartInstance = null;

    const initChart = () => {
      if (chartInstance) {
        chartInstance.destroy();
      }

      const ctx = chart.value.getContext('2d');
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: props.data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              grid: {
                color: '#e9ecef'
              },
              beginAtZero: true
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
    };

    onMounted(() => {
      Chart.register(...registerables);
      initChart();
    });

    watch(() => props.data, () => {
      initChart();
    }, { deep: true });

    return {
      chart
    };
  }
};
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>