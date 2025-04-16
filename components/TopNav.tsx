'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, HelpCircle } from 'lucide-react'

export function TopNav() {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 container mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm"></div>
            <Image 
              src="/Triple P Logo.png" 
              alt="Triple P Logo" 
              width={40} 
              height={40} 
              className="rounded-full relative"
              priority
            />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Parenta
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 md:justify-start md:ml-8">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      pathname === "/about" && "bg-accent text-accent-foreground shadow-sm"
                    )}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    FAQ
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side items (Theme Toggle and Mobile Menu) */}
        <div className="flex items-center space-x-4 ml-auto">
          <ThemeToggle />
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-accent/50 transition-colors"
                >
                  <Menu size={24} />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <nav className="space-y-2">
                    <Link href="/about" legacyBehavior passHref>
                      <Button
                        variant={pathname === "/about" ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start transition-all",
                          pathname === "/about" && "bg-secondary shadow-sm"
                        )}
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        FAQ
                      </Button>
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  )
} 