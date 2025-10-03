'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

interface FoodPreference {
  id: string;
  name: string;
  food: string;
  location: string;
  timestamp: string;
}

interface ApiResponse {
  success: boolean;
  foodPreferences: FoodPreference[];
  totalCount: number;
  fromDynamoDB?: boolean;
  fromMemory?: boolean;
}

export default function AdminPage() {
  const [data, setData] = useState<FoodPreference[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    fromDynamoDB: boolean;
    fromMemory: boolean;
  }>({ total: 0, fromDynamoDB: false, fromMemory: false });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("/api/store-food");
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setData(result.foodPreferences);
        setStats({
          total: result.totalCount,
          fromDynamoDB: result.fromDynamoDB || false,
          fromMemory: result.fromMemory || false,
        });
        setLastUpdated(new Date());
      } else {
        setError("Failed to fetch data");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStorageStatus = () => {
    if (stats.fromDynamoDB) return { text: "DynamoDB", color: "#10b981" };
    if (stats.fromMemory) return { text: "Memory", color: "#f59e0b" };
    return { text: "Unknown", color: "#6b7280" };
  };

  const storageStatus = getStorageStatus();

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1>ICF Digital Assistant - Data Analytics</h1>
        <div className={styles.headerActions}>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className={styles.refreshButton}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <div className={styles.storageStatus}>
            <span 
              className={styles.statusDot}
              style={{ backgroundColor: storageStatus.color }}
            ></span>
            {storageStatus.text}
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Total Interactions</h3>
          <p className={styles.statNumber}>{stats.total}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Data Source</h3>
          <p className={styles.statText} style={{ color: storageStatus.color }}>
            {storageStatus.text}
          </p>
        </div>
        <div className={styles.statCard}>
          <h3>Last Updated</h3>
          <p className={styles.statText}>
            {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
          </p>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div className={styles.tableContainer}>
        {loading && data.length === 0 ? (
          <div className={styles.loadingMessage}>
            Loading interaction data...
          </div>
        ) : data.length === 0 ? (
          <div className={styles.emptyMessage}>
            No interaction data found. Try using the digital assistant first!
          </div>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Preference</th>
                <th>Location</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td className={styles.idCell}>{item.id}</td>
                  <td>{item.name}</td>
                  <td className={styles.foodCell}>
                    <span className={styles.foodBadge}>{item.food}</span>
                  </td>
                  <td>{item.location}</td>
                  <td className={styles.timestampCell}>
                    {formatTimestamp(item.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.footer}>
        <p>
          This page shows all interaction data collected from the ICF Digital Assistant.
          Data is automatically refreshed every 30 seconds.
        </p>
        <p>
          <Link href="/" className={styles.backLink}>← Back to Digital Assistant</Link>
        </p>
      </div>
    </div>
  );
}
