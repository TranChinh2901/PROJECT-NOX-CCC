#!/bin/bash

# Monitoring Stack Health Check Script
# Verifies that all monitoring components are working correctly

set -e

echo "=========================================="
echo "Notification Monitoring Stack Health Check"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Check if Docker is running
echo "Checking Docker..."
if docker info > /dev/null 2>&1; then
    print_status 0 "Docker is running"
else
    print_status 1 "Docker is not running"
    exit 1
fi
echo ""

# Check if docker-compose is available
echo "Checking Docker Compose..."
if command -v docker-compose > /dev/null 2>&1; then
    print_status 0 "Docker Compose is installed"
else
    print_status 1 "Docker Compose is not installed"
    exit 1
fi
echo ""

# Check if monitoring stack is running
echo "Checking Monitoring Stack Services..."

# Prometheus
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
    print_status 0 "Prometheus is healthy (http://localhost:9090)"
else
    print_status 1 "Prometheus is not running"
fi

# Grafana
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    print_status 0 "Grafana is healthy (http://localhost:3001)"
else
    print_status 1 "Grafana is not running"
fi

# AlertManager
if curl -s http://localhost:9093/-/healthy > /dev/null 2>&1; then
    print_status 0 "AlertManager is healthy (http://localhost:9093)"
else
    print_status 1 "AlertManager is not running"
fi

# Elasticsearch
if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
    print_status 0 "Elasticsearch is healthy (http://localhost:9200)"
else
    print_status 1 "Elasticsearch is not running"
fi

# Kibana
if curl -s http://localhost:5601/api/status > /dev/null 2>&1; then
    print_status 0 "Kibana is healthy (http://localhost:5601)"
else
    print_status 1 "Kibana is not running"
fi
echo ""

# Check application endpoints (if running)
echo "Checking Application Endpoints..."
APP_URL="http://localhost:3000"

# Health endpoints
if curl -s $APP_URL/health/live > /dev/null 2>&1; then
    print_status 0 "Liveness endpoint responding ($APP_URL/health/live)"
else
    print_status 1 "Liveness endpoint not responding (app may not be running)"
fi

if curl -s $APP_URL/health/ready > /dev/null 2>&1; then
    print_status 0 "Readiness endpoint responding ($APP_URL/health/ready)"
else
    print_status 1 "Readiness endpoint not responding"
fi

if curl -s $APP_URL/health/status > /dev/null 2>&1; then
    print_status 0 "Status endpoint responding ($APP_URL/health/status)"
else
    print_status 1 "Status endpoint not responding"
fi

# Metrics endpoint
if curl -s $APP_URL/metrics > /dev/null 2>&1; then
    print_status 0 "Metrics endpoint responding ($APP_URL/metrics)"

    # Check if metrics have data
    METRIC_COUNT=$(curl -s $APP_URL/metrics | grep -c "^# HELP" || true)
    echo -e "  ${YELLOW}→${NC} Exposing $METRIC_COUNT metric types"
else
    print_status 1 "Metrics endpoint not responding"
fi
echo ""

# Check Prometheus targets
echo "Checking Prometheus Targets..."
if curl -s http://localhost:9090/api/v1/targets > /dev/null 2>&1; then
    TARGETS=$(curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"up"' | wc -l)
    print_status 0 "Prometheus has $TARGETS healthy target(s)"
else
    print_status 1 "Unable to check Prometheus targets"
fi
echo ""

# Check if dashboards exist
echo "Checking Grafana Dashboards..."
if [ -f "dashboards/notification-overview.json" ]; then
    print_status 0 "Overview dashboard found"
else
    print_status 1 "Overview dashboard not found"
fi

if [ -f "dashboards/notification-performance.json" ]; then
    print_status 0 "Performance dashboard found"
else
    print_status 1 "Performance dashboard not found"
fi

if [ -f "dashboards/notification-user-experience.json" ]; then
    print_status 0 "User Experience dashboard found"
else
    print_status 1 "User Experience dashboard not found"
fi
echo ""

# Check alert rules
echo "Checking Alert Rules..."
if [ -f "alerts/prometheus-alerts.yml" ]; then
    print_status 0 "Alert rules file found"

    CRITICAL_ALERTS=$(grep -c "severity: critical" alerts/prometheus-alerts.yml || true)
    WARNING_ALERTS=$(grep -c "severity: warning" alerts/prometheus-alerts.yml || true)
    INFO_ALERTS=$(grep -c "severity: info" alerts/prometheus-alerts.yml || true)

    echo -e "  ${YELLOW}→${NC} Critical alerts: $CRITICAL_ALERTS"
    echo -e "  ${YELLOW}→${NC} Warning alerts: $WARNING_ALERTS"
    echo -e "  ${YELLOW}→${NC} Info alerts: $INFO_ALERTS"
else
    print_status 1 "Alert rules file not found"
fi
echo ""

# Check configuration files
echo "Checking Configuration Files..."
for config in "config/prometheus.yml" "config/alertmanager.yml" "config/grafana-datasources.yml" "config/logstash.conf"; do
    if [ -f "$config" ]; then
        print_status 0 "$config exists"
    else
        print_status 1 "$config not found"
    fi
done
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo "  • Grafana:      http://localhost:3001 (admin/admin)"
echo "  • Prometheus:   http://localhost:9090"
echo "  • AlertManager: http://localhost:9093"
echo "  • Kibana:       http://localhost:5601"
echo ""
echo -e "${YELLOW}Application URLs:${NC}"
echo "  • Metrics:      http://localhost:3000/metrics"
echo "  • Health:       http://localhost:3000/health/status"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Import Grafana dashboards from 'dashboards/' directory"
echo "  2. Configure AlertManager with your PagerDuty/Slack credentials"
echo "  3. Start your application and verify metrics are being collected"
echo "  4. Review OBSERVABILITY_GUIDE.md for complete documentation"
echo ""
