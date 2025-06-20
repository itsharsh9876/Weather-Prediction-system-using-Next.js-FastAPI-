"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search } from 'lucide-react';

interface LocationSearchProps {
  onLocationChange: (location: string) => void;
}

export function LocationSearch({ onLocationChange }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const popularLocations = [
    'New York, NY',
    'London, UK',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Paris, France',
    'Los Angeles, CA'
  ];

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setIsSearching(true);
      // Simulate API call
      setTimeout(() => {
        onLocationChange(searchTerm.trim());
        setIsSearching(false);
        setSearchTerm('');
      }, 1000);
    }
  };

  const handleLocationClick = (location: string) => {
    onLocationChange(location);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search for a city or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Popular Locations</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {popularLocations.map((location) => (
              <button
                key={location}
                onClick={() => handleLocationClick(location)}
                className="flex items-center gap-2 p-2 text-left text-sm rounded-md hover:bg-muted transition-colors"
              >
                <MapPin className="w-3 h-3 text-muted-foreground" />
                {location}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}