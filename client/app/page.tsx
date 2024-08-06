"use client"

import React, { useState, useEffect } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function Component() {
  const [baseCurrency, setBaseCurrency] = useState('KZT')
  const [basePrice, setBasePrice] = useState(0)
  const [selectedCurrency, setSelectedCurrency] = useState('RUB')
  const [exchangeRate, setExchangeRate] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [commissionRate, setCommissionRate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; image: string; name: string; price: number }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchExchangeRate()
  }, [baseCurrency, selectedCurrency])

  const fetchExchangeRate = async () => {
    setIsLoading(true)
    try {
      const rate = await getExchangeRate(baseCurrency, selectedCurrency)
      setExchangeRate(rate)
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
    }
    setIsLoading(false)
  }

  const getExchangeRate = async (fromCurrency: string, toCurrency: string) => {
    const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY
    if (!API_KEY) {
      console.error('API key is not set. Please check your environment variables.')
      return null
    }
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${fromCurrency}/${toCurrency}`)
    const data = await response.json()
    return data.conversion_rate
  }

  const convertPrice = (price: any, rate: any) => {
    if (isLoading || !rate) return 'Loading...'
    const convertedPrice = price * rate
    const commission = parseFloat(commissionRate) || 0
    const withCommission = convertedPrice / (1 - (commission / 100))
    return withCommission.toFixed(2)
  }

  const handleCurrencyChange = (currency: any) => {
    setSelectedCurrency(currency)
  }

  const handleCommissionChange = (e: { target: { value: any } }) => {
    const value = e.target.value
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setCommissionRate(value)
    }
  }

  const formatCurrency = (amount: any, currency: any) => {
    if (isNaN(amount)) return "Free" 
    if (amount === 'Free') return amount
    if (amount === 'Loading...') return amount
    switch(currency) {
      case 'RUB': return `₽${amount}`
      case 'USD': return `$${amount}`
      case 'EUR': return `€${amount}`
      case 'KZT': return `₸${amount}`
      default: return amount
    }
  }

  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/search-steam?query=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data from Steam');
      }
      const data = await response.json();
      setSearchResults(data);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error searching Steam:', error);
      // You might want to show an error message to the user here
    }
  }

  const handleGameSelect = (game: any) => {
    setBasePrice(game.price)
    setIsDialogOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 lg:px-8 h-20 flex items-center">
        <Link href="#" className="flex items-center" prefetch={false}>
          <SwapIcon className="h-10 w-10 text-white" />
          <span className="ml-2 text-xl font-bold text-white">Swapper</span>
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center px-6 bg-cover bg-center pt-12">
        <section className="w-full mb-12 flex justify-center items-center">
          <div className="w-full md:w-2/3 lg:w-1/2 flex flex-col justify-center items-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter mb-4 text-white text-center">
              Convert Kazakhstan steam prices
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white text-center">
              Find out how much you need to deposit.
            </p>
          </div>
        </section>
        <div className="w-full max-w-xl space-y-6 text-center text-white">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search for a game on Steam"
              className="w-full px-6 py-4 text-lg rounded-xl bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch} className="px-6 py-4 text-lg rounded-xl bg-white/20 text-white hover:bg-white/30">
              Search
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Search Results</DialogTitle>
              </DialogHeader>
              <div className="mt-4 h-[400px] overflow-y-auto pr-2" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#6B7280 transparent'
              }}>
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map(game => (
                      <div 
                        key={game.id} 
                        className="flex items-center space-x-4 p-2 hover:bg-gray-500 cursor-pointer rounded-lg transition-colors"
                        onClick={() => handleGameSelect(game)}
                      >
                        <img src={game.image} alt={game.name} className="w-24 h-16 object-cover rounded-lg" />
                        <div className="flex-grow">
                          <div className="font-semibold">{game.name}</div>
                        </div>
                        <div className="text-lg font-bold">
                          {formatCurrency(game.price, baseCurrency)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-lg text-gray-500">No results found. Please try a different search term.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-lg mb-2">Price in {baseCurrency}</div>
              <div className="text-3xl font-bold">{formatCurrency(basePrice, baseCurrency)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-lg mb-2">Price in {selectedCurrency}</div>
              <div className="text-3xl font-bold">
                {formatCurrency(convertPrice(basePrice, exchangeRate), selectedCurrency)}
              </div>
            </div>
          </div>
          <Select onValueChange={handleCurrencyChange} value={selectedCurrency}>
            <SelectTrigger className="w-full px-6 py-4 text-lg rounded-xl bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="KZT">KZT</SelectItem>
              <SelectItem value="RUB">RUB</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-4">
            <label htmlFor="commission" className="text-lg whitespace-nowrap">Commission:</label>
            <div className="relative flex-grow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
              <Input
                id="commission"
                type="number"
                placeholder="Enter commission rate"
                value={commissionRate}
                onChange={handleCommissionChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-6 py-4 text-lg rounded-xl bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white pr-10"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lg">%</span>
            </div>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-white bg-white/10">
        <p className="text-sm">&copy; 2024 Swapper. All rights reserved.</p>
      </footer>
    </div>
  )
}

function SwapIcon(props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  )
}