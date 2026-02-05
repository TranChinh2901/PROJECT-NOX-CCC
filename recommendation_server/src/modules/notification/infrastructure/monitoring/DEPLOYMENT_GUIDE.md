# Observability Stack Deployment Guide

## Quick Start (Local Development)

### 1. Start Observability Stack

```bash
cd src/modules/notification/infrastructure/monitoring
docker-compose up -d
```

This will start:
- Prometheus (metrics): http://localhost:9090
- Grafana (dashboards): http://localhost:3001 (admin/admin)
- AlertManager (alerts): http://localhost:9093
- Elasticsearch (logs): http://localhost:9200
- Kibana (log viewer): http://localhost:5601

### 2. Verify Services

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

### 3. Access Dashboards

**Grafana**: http://localhost:3001
- Username: `admin`
- Password: `admin`
- Prometheus datasource is pre-configured
- Import dashboards from `dashboards/` directory

**Prometheus**: http://localhost:9090
- Check targets: http://localhost:9090/targets
- Verify notification-service target is UP

**Kibana**: http://localhost:5601
- Create index pattern: `notification-logs-*`
- Time field: `@timestamp`

### 4. Configure Application

Update your application to expose metrics:

```typescript
// In your main.ts or app.ts
import { HealthController, MetricsController } from './modules/notification/infrastructure/monitoring';

const healthController = new HealthController();
const metricsController = new MetricsController();

app.get('/health/live', (req, res) => healthController.liveness(req, res));
app.get('/health/ready', (req, res) => healthController.readiness(req, res));
app.get('/health/status', (req, res) => healthController.status(req, res));
app.get('/metrics', (req, res) => metricsController.prometheus(req, res));
```

### 5. Verify Metrics

```bash
# Check metrics endpoint
curl http://localhost:3000/metrics

# Check health endpoints
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/status
```

---

## Production Deployment

### Prerequisites

- Kubernetes cluster or VMs
- Persistent storage for Prometheus, Grafana, Elasticsearch
- Network access between services
- DNS or service discovery

### Option 1: Kubernetes Deployment

#### 1. Create Namespace

```bash
kubectl create namespace monitoring
```

#### 2. Deploy Prometheus

```yaml
# prometheus-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:v2.40.0
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: storage
        persistentVolumeClaim:
          claimName: prometheus-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP
```

Apply:
```bash
kubectl apply -f prometheus-deployment.yaml
```

#### 3. Deploy Grafana

```yaml
# grafana-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:9.3.0
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-secrets
              key: admin-password
        volumeMounts:
        - name: storage
          mountPath: /var/lib/grafana
      volumes:
      - name: storage
        persistentVolumeClaim:
          claimName: grafana-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

Apply:
```bash
kubectl create secret generic grafana-secrets --from-literal=admin-password=your-password -n monitoring
kubectl apply -f grafana-deployment.yaml
```

#### 4. Configure ServiceMonitor (Prometheus Operator)

```yaml
# notification-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: notification-service
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: notification-service
  endpoints:
  - port: metrics
    path: /metrics
    interval: 15s
```

Apply:
```bash
kubectl apply -f notification-servicemonitor.yaml
```

### Option 2: Docker Swarm Deployment

#### 1. Initialize Swarm

```bash
docker swarm init
```

#### 2. Create Stack

```yaml
# docker-stack.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.40.0
    configs:
      - source: prometheus_config
        target: /etc/prometheus/prometheus.yml
    volumes:
      - prometheus-data:/prometheus
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  grafana:
    image: grafana/grafana:9.3.0
    environment:
      - GF_SECURITY_ADMIN_PASSWORD__FILE=/run/secrets/grafana_password
    secrets:
      - grafana_password
    volumes:
      - grafana-data:/var/lib/grafana
    deploy:
      replicas: 1

configs:
  prometheus_config:
    file: ./config/prometheus.yml

secrets:
  grafana_password:
    external: true

volumes:
  prometheus-data:
  grafana-data:
```

Deploy:
```bash
echo "your-password" | docker secret create grafana_password -
docker stack deploy -c docker-stack.yml monitoring
```

### Option 3: VM Deployment

#### 1. Install Prometheus

```bash
# Download and extract
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64

# Copy configuration
cp /path/to/monitoring/config/prometheus.yml ./prometheus.yml

# Create systemd service
sudo tee /etc/systemd/system/prometheus.service << EOF
[Unit]
Description=Prometheus
After=network.target

[Service]
Type=simple
User=prometheus
ExecStart=/opt/prometheus/prometheus --config.file=/opt/prometheus/prometheus.yml --storage.tsdb.path=/var/lib/prometheus
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable prometheus
sudo systemctl start prometheus
```

#### 2. Install Grafana

```bash
# Add repository
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

# Install
sudo apt-get update
sudo apt-get install grafana

# Start service
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

---

## Configuration

### 1. Configure Prometheus Scrape Targets

Edit `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'notification-service'
    static_configs:
      - targets: ['notification-service:3000']
    # Or for Kubernetes service discovery
    kubernetes_sd_configs:
      - role: endpoints
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_label_app]
        regex: notification-service
        action: keep
```

### 2. Configure AlertManager

Edit `alertmanager.yml` with your PagerDuty/Slack credentials:

```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'

  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK'
        channel: '#alerts'
```

### 3. Import Grafana Dashboards

1. Login to Grafana (http://localhost:3001)
2. Navigate to Dashboards → Import
3. Upload each dashboard JSON from `dashboards/`:
   - `notification-overview.json`
   - `notification-performance.json`
   - `notification-user-experience.json`

---

## Monitoring Checklist

### Pre-Deployment

- [ ] Prometheus configured and scraping metrics
- [ ] AlertManager configured with notification channels
- [ ] Grafana dashboards imported
- [ ] Health check endpoints responding
- [ ] Log aggregation configured
- [ ] Alert rules tested

### Post-Deployment

- [ ] Verify Prometheus targets are UP
- [ ] Check Grafana dashboards show data
- [ ] Test alert notifications (send test alert)
- [ ] Verify logs appearing in Kibana
- [ ] Check metric cardinality (avoid high-cardinality labels)
- [ ] Review alert thresholds for your environment

---

## Scaling Considerations

### Prometheus

- **Retention**: Default 30 days, adjust based on storage
- **Storage**: ~1-2 bytes per sample, estimate based on metrics
- **Memory**: Rule of thumb: 3x storage size in RAM
- **Federation**: Use for multi-cluster setups

### Grafana

- **Database**: Use PostgreSQL for production (default SQLite)
- **High Availability**: Deploy multiple instances behind load balancer
- **Caching**: Enable query caching for better performance

### Elasticsearch

- **Shards**: Start with 1 primary, 1 replica
- **Heap Size**: Set to 50% of RAM, max 32GB
- **Retention**: Use ILM policies to manage old indices
- **Scaling**: Add data nodes for more storage/throughput

---

## Troubleshooting

### Prometheus Not Scraping

1. Check target in Prometheus UI: http://localhost:9090/targets
2. Verify network connectivity: `curl http://notification-service:3000/metrics`
3. Check scrape interval and timeout
4. Review Prometheus logs: `docker-compose logs prometheus`

### Grafana Dashboards Empty

1. Verify Prometheus datasource: Configuration → Data Sources
2. Test datasource connection
3. Check time range on dashboard
4. Verify metrics exist: Query Prometheus directly

### Alerts Not Firing

1. Check AlertManager: http://localhost:9093
2. Verify alert rules: http://localhost:9090/alerts
3. Check alert state (pending/firing)
4. Review AlertManager logs

### Logs Not Appearing

1. Verify Logstash is running: `docker-compose logs logstash`
2. Check Elasticsearch indices: `curl http://localhost:9200/_cat/indices`
3. Verify log format matches Logstash configuration
4. Check Kibana index pattern

---

## Security Considerations

### Production Hardening

1. **Enable Authentication**: Configure Grafana, Prometheus, Kibana auth
2. **Use HTTPS**: Configure TLS for all services
3. **Network Policies**: Restrict access to monitoring services
4. **Secrets Management**: Use Kubernetes secrets or Vault
5. **RBAC**: Configure role-based access control
6. **Rate Limiting**: Protect metrics endpoints from abuse

### Example Nginx Reverse Proxy

```nginx
# Prometheus
location /prometheus/ {
    proxy_pass http://prometheus:9090/;
    auth_basic "Prometheus";
    auth_basic_user_file /etc/nginx/.htpasswd;
}

# Grafana
location /grafana/ {
    proxy_pass http://grafana:3000/;
}
```

---

## Maintenance

### Regular Tasks

- **Weekly**: Review dashboards, check for anomalies
- **Monthly**: Review and update alert thresholds
- **Quarterly**: Audit metric cardinality, optimize queries
- **Annually**: Review retention policies, capacity planning

### Backup

```bash
# Backup Prometheus data
tar -czf prometheus-backup-$(date +%Y%m%d).tar.gz /var/lib/prometheus/data

# Backup Grafana dashboards (export as JSON)
# Backup Elasticsearch indices
curl -XPUT 'localhost:9200/_snapshot/backup' -H 'Content-Type: application/json' -d '{
  "type": "fs",
  "settings": {
    "location": "/backup/elasticsearch"
  }
}'
```

---

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kubernetes Monitoring](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-usage-monitoring/)

---

## Support

For issues or questions:
- Review [OBSERVABILITY_GUIDE.md](./OBSERVABILITY_GUIDE.md)
- Check [QUICK_START.md](./QUICK_START.md)
- Contact DevOps team
