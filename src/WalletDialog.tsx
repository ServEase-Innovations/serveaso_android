import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

interface WalletDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: string;
  status: string;
}

const WalletDialog: React.FC<WalletDialogProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState('transactions');

  // Dummy wallet data
  const walletData = {
    balance: 5420,
    transactions: [
      { id: 1, type: 'credit', amount: 2000, description: 'Home Cook Service', date: 'Aug 28, 2025', status: 'Completed' },
      { id: 2, type: 'debit', amount: 1500, description: 'Maid Service', date: 'Aug 25, 2025', status: 'Completed' },
      { id: 3, type: 'credit', amount: 3000, description: 'Wallet Top-up', date: 'Aug 20, 2025', status: 'Completed' },
      { id: 4, type: 'debit', amount: 1200, description: 'CareGiver Service', date: 'Aug 18, 2025', status: 'Refunded' },
      { id: 5, type: 'credit', amount: 1000, description: 'Referral Bonus', date: 'Aug 15, 2025', status: 'Completed' },
    ],
    rewards: 450,
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.dialogContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>My Wallet</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>₹{walletData.balance}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.addMoneyButton}>
                  <Text style={styles.addMoneyText}>➕ Add Money</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.transferButton}>
                  <Text style={styles.transferText}>🔄 Transfer</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
                onPress={() => setActiveTab('transactions')}
              >
                <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
                  Transactions
                </Text>
                {activeTab === 'transactions' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
                onPress={() => setActiveTab('rewards')}
              >
                <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
                  Rewards
                </Text>
                {activeTab === 'rewards' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'transactions' ? (
              <View>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <ScrollView style={styles.transactionList}>
                  {walletData.transactions.map((transaction: Transaction) => (
                    <View key={transaction.id} style={styles.transactionItem}>
                      <View
                        style={[
                          styles.transactionIcon,
                          transaction.type === 'credit' ? styles.creditIcon : styles.debitIcon,
                        ]}
                      >
                        <Text style={transaction.type === 'credit' ? styles.creditText : styles.debitText}>
                          {transaction.type === 'credit' ? '✔' : '✖'}
                        </Text>
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionDescription}>{transaction.description}</Text>
                        <Text style={styles.transactionMeta}>
                          {transaction.date} • {transaction.status}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount,
                        ]}
                      >
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View>
                <Text style={styles.sectionTitle}>Your Rewards</Text>
                <View style={styles.rewardsCard}>
                  <View style={styles.rewardsHeader}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={styles.rewardsPoints}>{walletData.rewards} Points</Text>
                  </View>
                  <Text style={styles.rewardsDescription}>
                    Earn more points by completing services and referring friends
                  </Text>
                  <TouchableOpacity style={styles.rewardsButton}>
                    <Text style={styles.rewardsButtonText}>View Rewards Catalog</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  closeIcon: {
    fontSize: 24,
    color: '#9ca3af',
  },
  content: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceLabel: {
    color: '#93c5fd',
    fontSize: 14,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addMoneyButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addMoneyText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  transferButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  transferText: {
    color: 'white',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  tab: {
    padding: 16,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2563eb',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#2563eb',
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    fontSize: 16,
  },
  transactionList: {
    maxHeight: 256,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditIcon: {
    backgroundColor: '#dcfce7',
  },
  debitIcon: {
    backgroundColor: '#fee2e2',
  },
  creditText: {
    color: '#16a34a',
  },
  debitText: {
    color: '#dc2626',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 16,
  },
  transactionDescription: {
    fontWeight: '500',
    color: '#1f2937',
  },
  transactionMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontWeight: '600',
    fontSize: 16,
  },
  creditAmount: {
    color: '#16a34a',
  },
  debitAmount: {
    color: '#dc2626',
  },
  rewardsCard: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  starIcon: {
    fontSize: 20,
  },
  rewardsPoints: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rewardsDescription: {
    color: '#fef3c7',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  rewardsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rewardsButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default WalletDialog;